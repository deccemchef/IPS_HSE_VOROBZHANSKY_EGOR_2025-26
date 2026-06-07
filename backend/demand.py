def marginal_benefit(buyer, k):
    # Предельная полезность k-й единицы товара для данного покупателя
    demand_type = buyer["demand_type"]
    params = buyer["params"]

    if k <= 0:
        return 0

    if demand_type == "linear":
        # MB(k) = a - b*(k-1): каждая следующая единица ценится на b меньше
        a = params["a"]
        b = params["b"]
        return max(a - b * (k - 1), 0)

    elif demand_type == "inverse_square":
        # MB(k) = A/k²: быстро убывающий спрос
        A = params["A"]
        return A / (k ** 2)

    elif demand_type == "step":
        # Ступенчатый спрос: фиксированные значения из списка
        values = params["values"]
        if k <= len(values):
            return values[k - 1]
        return 0

    else:
        raise ValueError(f"Unknown demand_type: {demand_type}")


def total_value(buyer, q):
    # V(q) = сумма MB(1) + MB(2) + ... + MB(q)
    total = 0
    for k in range(1, q + 1):
        total += marginal_benefit(buyer, k)
    return total
