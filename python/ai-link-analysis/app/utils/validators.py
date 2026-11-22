import ipaddress
import socket
from urllib.parse import urlparse

BLOCKED_HOSTNAMES = {
    "localhost",
    "localhost.localdomain",
    "ip6-localhost",
    "ip6-loopback",
    "metadata",
    "metadata.google.internal",
    "metadata.goog",
}


class URLValidationError(ValueError):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.status_code = status_code


def _is_private_or_reserved(ip_str: str) -> bool:
    try:
        ip_obj = ipaddress.ip_address(ip_str)
    except ValueError:
        return True
    if ip_obj.version == 6 and ip_obj.ipv4_mapped:
        ip_obj = ip_obj.ipv4_mapped
    return (
        ip_obj.is_private
        or ip_obj.is_loopback
        or ip_obj.is_link_local
        or ip_obj.is_multicast
        or ip_obj.is_reserved
        or ip_obj.is_unspecified
    )


def validate_public_url(raw_url: str) -> str:
    if not isinstance(raw_url, str) or not raw_url.strip():
        raise URLValidationError("A non-empty website URL is required.", 400)

    cleaned = raw_url.strip()
    if len(cleaned) > 2048:
        raise URLValidationError("URL exceeds maximum length of 2048 characters.", 400)

    parsed = urlparse(cleaned)
    if parsed.scheme not in {"http", "https"}:
        raise URLValidationError("Only http:// and https:// URLs are supported.", 400)

    if parsed.username or parsed.password:
        raise URLValidationError("Embedded credentials in URLs are not permitted.", 400)

    hostname = (parsed.hostname or "").lower().rstrip(".")
    if not hostname:
        raise URLValidationError("URL must contain a valid hostname.", 400)

    if (
        hostname in BLOCKED_HOSTNAMES
        or hostname.endswith(".local")
        or hostname.endswith(".internal")
        or hostname.endswith(".localhost")
    ):
        raise URLValidationError("Access to internal or metadata hosts is blocked.", 400)

    try:
        ip_literal = ipaddress.ip_address(hostname)
        if _is_private_or_reserved(str(ip_literal)):
            raise URLValidationError("Access to private or reserved IP ranges is blocked.", 400)
        return cleaned
    except ValueError:
        pass

    if "." not in hostname:
        raise URLValidationError("Hostname must be a fully qualified public domain.", 400)

    try:
        addr_info = socket.getaddrinfo(hostname, None, proto=socket.IPPROTO_TCP)
    except socket.gaierror as exc:
        raise URLValidationError(f"Unable to resolve domain '{hostname}'.", 422) from exc

    for entry in addr_info:
        resolved_ip = entry[4][0]
        if _is_private_or_reserved(resolved_ip):
            raise URLValidationError("Resolved domain IP belongs to a private or reserved network.", 400)

    return cleaned
