from __future__ import annotations

from datetime import date, timedelta
from calendar import monthrange


def last_day_of_month(year: int, month: int) -> int:
    return monthrange(year, month)[1]


def add_months(value: date, months: int) -> date:
    year = value.year + (value.month - 1 + months) // 12
    month = (value.month - 1 + months) % 12 + 1
    day = min(value.day, last_day_of_month(year, month))
    return date(year, month, day)


def add_period(value: date, period: str, interval: int) -> date:
    safe_interval = max(int(interval or 1), 1)
    if period == "day":
        return value + timedelta(days=safe_interval)
    if period == "week":
        return value + timedelta(weeks=safe_interval)
    if period == "year":
        return add_months(value, 12 * safe_interval)
    return add_months(value, safe_interval)


def month_key(value: date) -> str:
    return f"{value.year}-{value.month:02d}"


def iter_payments(
    start_date: date,
    period: str,
    interval: int,
    range_start: date,
    range_end: date,
):
    if start_date is None:
        return
    current = start_date
    if current < range_start:
        while current < range_start:
            current = add_period(current, period, interval)
    while current <= range_end:
        yield current
        current = add_period(current, period, interval)


def build_month_starts(range_start: date, months: int) -> list[date]:
    base = date(range_start.year, range_start.month, 1)
    return [add_months(base, offset) for offset in range(months)]
