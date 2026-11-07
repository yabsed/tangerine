from pydantic import BaseModel


class RegionResponse(BaseModel):
    id: str
    sido: str
    sigugun: str
    dong: str
    full_name: str

    class Config:
        from_attributes = True
