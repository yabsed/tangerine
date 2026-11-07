.PHONY: sync reqs

# 로컬 개발용: uv 기반 의존성 동기화
sync:
	uv sync

# 배포용: requirements.txt 생성 (pip 기준)
reqs:
	uv export \
		--format requirements-txt \
		--locked \
		--no-dev \
		--no-hashes \
		-o requirements.txt
