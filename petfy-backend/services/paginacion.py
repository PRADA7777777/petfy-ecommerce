# backend/services/paginacion.py
from sqlalchemy.orm import Query


def paginar(consulta: Query, page: int, pageSize: int, maximo: int = 100) -> dict:
    """Devuelve una página de la consulta ya ordenada, con la forma {data, total, page, pageSize}."""
    page = max(page, 1)
    pageSize = min(max(pageSize, 1), maximo)
    return {
        "data": consulta.offset((page - 1) * pageSize).limit(pageSize).all(),
        "total": consulta.count(),
        "page": page,
        "pageSize": pageSize,
    }
