import io
import unittest
from unittest.mock import AsyncMock, patch
from urllib.parse import urlsplit
from uuid import UUID, uuid4

from fastapi import HTTPException, UploadFile
from fastapi.testclient import TestClient
from starlette.datastructures import Headers

from carrot.main import app
from carrot.app.image.services import IMAGE_BUCKET, ImageService, s3_client
from carrot.db.connection import get_session_factory


def image_file(content_type="image/png", size=8):
    return UploadFile(
        io.BytesIO(b"test png"),
        size=size,
        filename="private-original-name.png",
        headers=Headers({"content-type": content_type}),
    )


class ImageServiceTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.service = ImageService(None)
        self.service.repository = AsyncMock()
        self.service.repository.upload_image.side_effect = lambda image: image

    async def test_upload_stores_unsigned_url_and_uses_only_image_bucket(self):
        file = image_file()
        with patch.object(s3_client, "upload_fileobj") as upload:
            image = await self.service.upload_image(file)

        self.assertEqual(str(UUID(image.id)), image.id)
        url = urlsplit(image.image_url)
        self.assertEqual(url.scheme, "https")
        self.assertEqual(url.netloc, f"{IMAGE_BUCKET}.s3.ap-southeast-2.amazonaws.com")
        self.assertEqual(url.path, f"/images/{image.id}")
        self.assertEqual(url.query, "")
        self.assertNotIn(file.filename, image.image_url)

        upload.assert_called_once_with(
            file.file,
            IMAGE_BUCKET,
            f"images/{image.id}",
            ExtraArgs={
                "ContentType": "image/png",
                "CacheControl": "public, max-age=86400",
            },
        )
        self.service.repository.upload_image.assert_awaited_once_with(image)

    async def test_rejected_uploads_do_not_write_s3_or_database(self):
        for content_type, size, expected in (
            ("text/html",      8,                     415),
            ("image/svg+xml",  8,                     415),
            ("image/png",      5 * 1024 * 1024 + 1,   413),
            ("image/png",      None,                  413),
        ):
            with self.subTest(content_type=content_type, size=size):
                with patch.object(s3_client, "upload_fileobj") as upload:
                    with self.assertRaises(HTTPException) as error:
                        await self.service.upload_image(image_file(content_type, size))
                    self.assertEqual(error.exception.status_code, expected)
                    upload.assert_not_called()
        self.service.repository.upload_image.assert_not_awaited()

    async def test_missing_image_returns_404(self):
        self.service.repository.get_image_by_image_id.return_value = None
        with self.assertRaises(HTTPException) as error:
            await self.service.view_image(str(uuid4()))
        self.assertEqual(error.exception.status_code, 404)


class ImageRouteTests(unittest.TestCase):
    def setUp(self):
        async def no_database():
            yield None

        app.dependency_overrides[get_session_factory] = no_database
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()
        self.client.close()

    def test_metadata_reads_return_only_id_and_url_without_downloading_s3(self):
        image_id = str(uuid4())
        origin = f"https://{IMAGE_BUCKET}.s3.ap-southeast-2.amazonaws.com"
        data = {"id": image_id, "image_url": f"{origin}/images/{image_id}"}

        service = AsyncMock()
        service.view_image.return_value = data

        with patch("carrot.app.image.router.ImageService", return_value=service):
            with patch.object(s3_client, "get_object") as download:
                for kind in ("product", "user"):
                    response = self.client.get(f"/api/image/{kind}/{image_id}")
                    self.assertEqual(response.status_code, 200)
                    self.assertEqual(response.json(), data)
                download.assert_not_called()

    def test_uploads_still_require_authentication(self):
        with patch.object(s3_client, "upload_fileobj") as upload:
            for kind in ("product", "user"):
                response = self.client.post(
                    f"/api/image/{kind}",
                    files={"file": ("test.png", b"test png", "image/png")},
                )
                self.assertIn(response.status_code, (401, 403))
            upload.assert_not_called()
