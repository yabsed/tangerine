import io
import unittest
from unittest.mock import patch
from uuid import uuid4

from botocore.response import StreamingBody

from carrot.app.image.services import image_content, s3_client


class ImageStreamTest(unittest.TestCase):
    def test_reads_and_closes_the_s3_stream(self):
        raw = io.BytesIO(b"image bytes")
        response = {"Body": StreamingBody(raw, 11), "ContentType": "image/png"}
        with patch.object(s3_client, "get_object", return_value=response):
            chunks, content_type = image_content(uuid4())
            self.assertEqual(b"".join(chunks), b"image bytes")
            self.assertEqual(content_type, "image/png")
        self.assertTrue(raw.closed)

    def test_closes_the_stream_when_consumption_stops(self):
        raw = io.BytesIO(b"x" * 100000)
        response = {"Body": StreamingBody(raw, 100000), "ContentType": "image/png"}
        with patch.object(s3_client, "get_object", return_value=response):
            chunks, _ = image_content(uuid4())
            next(chunks)
            chunks.close()
        self.assertTrue(raw.closed)
