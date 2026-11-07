from typing import Annotated, List

from fastapi import APIRouter, Depends, Query

from carrot.app.auth.utils import login_with_header, partial_login_with_header, login_with_header_optional
from carrot.app.user.models import User
from carrot.app.product.models import Product, UserProduct
from carrot.app.product.schemas import (
    ProductListResponse,
    ProductPostRequest,
    ProductPatchRequest,
    ProductResponse,
)
from carrot.app.product.services import ProductService
from carrot.app.product.exceptions import ShouldLoginException

product_router = APIRouter()


@product_router.post("/", status_code=201, response_model=ProductResponse)
async def create_post(
    user: Annotated[User, Depends(login_with_header)],
    request: ProductPostRequest,
    service: Annotated[ProductService, Depends()],
) -> ProductResponse:
    product = await service.create_post(
        user_id=user.id,
        product_request=request,
        region_id=user.region_id,
        auction_data=request.auction,
    )
    return ProductResponse.model_validate(product)

@product_router.patch("/{product_id}", status_code=200, response_model=ProductResponse)
async def update_post(
    product_id: str,
    user: Annotated[User, Depends(login_with_header)],
    request: ProductPatchRequest,
    service: Annotated[ProductService, Depends()],
) -> ProductResponse:
    product = await service.update_post(
        user_id=user.id,
        id=product_id,
        title=request.title,
        image_ids=request.image_ids,
        content=request.content,
        price=request.price,
        category_id=request.category_id,
        region_id=request.region_id,
        is_sold=request.is_sold,
    )
    return ProductResponse.model_validate(product)

@product_router.get("/{product_id}", status_code=200, response_model=ProductResponse)
async def view_post(
    product_id: str,
    service: Annotated[ProductService, Depends()],
) -> ProductResponse:
    product = await service.view_post_by_product_id(product_id)
    
    return ProductResponse.model_validate(product)

@product_router.get("/", status_code=200, response_model=List[ProductListResponse])
async def view_posts(
    service: Annotated[ProductService, Depends()],
    user: Annotated[User | None, Depends(login_with_header_optional)],
    user_id: str | None = Query(default=None, alias="seller"),
    keyword: str | None = Query(default=None, alias="search"),
    region_id: str | None = Query(default=None, alias="region"),
) -> List[ProductListResponse]:
    if user_id == "me":
        if user is None:
            raise ShouldLoginException
        user_id = user.id

    if user_id or keyword or region_id:
        products = await service.view_posts_by_query(user_id, keyword, region_id)
    else:
        products = await service.view_posts_all()

    return [ProductListResponse.model_validate(p) for p in products]

@product_router.delete("/{product_id}", status_code=200, response_model=None)
async def remove_post(
    product_id: str,
    user: Annotated[User, Depends(login_with_header)],
    service: Annotated[ProductService, Depends()],
):
    await service.remove_post(
        user.id,
        product_id,
    )
    
    return None