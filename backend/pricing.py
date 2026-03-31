from demand import total_value


def uniform_price(q, params, buyer=None):
    p = params["p"]
    return p * q


def pd1_price(q, params, buyer):
    return total_value(buyer, q)


def pd2_price(q, params, buyer=None):
    if q == 0:
        return 0

    F = params["F"]
    p = params["p"]
    return F + p * q


def pd3_price(q, params, buyer):
    segment = buyer["segment"]
    segment_prices = params["segment_prices"]
    p = segment_prices[segment]
    return p * q