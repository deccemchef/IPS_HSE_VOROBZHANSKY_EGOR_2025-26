from demand import total_value


def uniform_price(q, params, buyer=None):
    # Единая цена: T(q) = p * q
    p = params["p"]
    return p * q


def pd1_price(q, params, buyer):
    # Первая степень: фирма забирает всю ценность, T(q) = V(q)
    return total_value(buyer, q)


def pd2_price(q, params, buyer=None):
    # Двухчастный тариф: T(q) = F + p*q, при q=0 покупатель не платит ничего
    if q == 0:
        return 0
    F = params["F"]
    p = params["p"]
    return F + p * q


def pd3_price(q, params, buyer):
    # Третья степень: цена зависит от сегмента покупателя (A, B или C)
    segment = buyer["segment"]
    segment_prices = params["segment_prices"]
    p = segment_prices[segment]
    return p * q
