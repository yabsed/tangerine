from logging.config import fileConfig

from sqlalchemy import create_engine, pool

from alembic import context

from carrot.db.settings import DB_SETTINGS
from carrot.db.common import Base

# 모델 import (autogenerate에 필요)
import carrot.app.auth.models  # noqa: F401
import carrot.app.category.models  # noqa: F401
import carrot.app.chat.models  # noqa: F401
import carrot.app.product.models  # noqa: F401
import carrot.app.image.models  # noqa: F401
import carrot.app.region.models  # noqa: F401
import carrot.app.user.models  # noqa: F401
import carrot.app.pay.models  # noqa: F401
import carrot.app.auction.models  # noqa: F401
import carrot.app.image.models  # noqa: F401


config = context.config

# ✅ Alembic은 sync 드라이버로 강제
sync_url = DB_SETTINGS.url.replace("+aiomysql", "+pymysql")
config.set_main_option("sqlalchemy.url", sync_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    context.configure(
        url=sync_url,  # ✅ 여기
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,  # 선택: 타입 변경 감지
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = create_engine(sync_url, poolclass=pool.NullPool)  # ✅ 여기

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,  # 선택
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
