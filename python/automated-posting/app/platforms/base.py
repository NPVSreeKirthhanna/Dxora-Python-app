from abc import ABC, abstractmethod
from datetime import datetime, timezone
from app.schemas import PlatformResult


class BasePlatform(ABC):
    name: str

    @abstractmethod
    async def publish(self, message: str, cta_url: str) -> PlatformResult:
        raise NotImplementedError

    @staticmethod
    def _now_date_time() -> tuple[str, str]:
        now = datetime.now(timezone.utc)
        return now.strftime("%Y-%m-%d"), now.strftime("%H:%M:%S")

    def _success(self, posted_url: str, public_access: bool = True) -> PlatformResult:
        date_str, time_str = self._now_date_time()
        return PlatformResult(
            platform=self.name,
            status="success",
            posted_url=posted_url,
            public_access=public_access,
            date=date_str,
            time=time_str,
            error=None,
        )

    def _failed(self, error: str) -> PlatformResult:
        return PlatformResult(
            platform=self.name,
            status="failed",
            posted_url=None,
            public_access=False,
            date=None,
            time=None,
            error=error,
        )
