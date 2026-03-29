def marginal_benefit(buyer, k):
    """
    Возвращает предельную полезность k-й единицы для конкретного покупателя.

    buyer: dict с полями:
        demand_type: "linear" | "inverse_square" | "step"
        params: dict с параметрами функции спроса

    k: номер единицы товара (1, 2, 3, ...)
    """

    demand_type = buyer["demand_type"]
    params = buyer["params"]

    if k <= 0:
        return 0

    if demand_type == "linear":
        # MB(k) = max(a - b*(k-1), 0)
        a = params["a"]
        b = params["b"]
        return max(a - b * (k - 1), 0)

    elif demand_type == "inverse_square":
        # MB(k) = A / k^2
        # A — масштаб, чтобы функция не была слишком маленькой
        A = params["A"]
        return A / (k ** 2)

    elif demand_type == "step":
        # Ступенчатая функция задается списком values:
        # values[0] = MB(1), values[1] = MB(2), ...
        values = params["values"]

        if k <= len(values):
            return values[k - 1]
        return 0

    else:
        raise ValueError(f"Unknown demand_type: {demand_type}")


def total_value(buyer, q):
    """
    Считает суммарную ценность q единиц:
    V(q) = MB(1) + MB(2) + ... + MB(q)
    """

    total = 0
    for k in range(1, q + 1):
        total += marginal_benefit(buyer, k)
    return total