import re

PRICE_PATTERNS = [
    r'(\d+[.,]?\d*)\s?(руб|₽)',
    r'(\d+[.,]?\d*)\s?(usd|\$)',
    r'(\d+[.,]?\d*)\s?(eur|€)',
]


def extract_price(text):

    for pattern in PRICE_PATTERNS:
        match = re.search(pattern, text.lower())

        if match:
            price = match.group(1).replace(",", ".")
            currency = match.group(2)

            return price, currency

    return None, None