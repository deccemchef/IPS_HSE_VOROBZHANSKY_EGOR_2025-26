def marginal_benefit(buyer, k):
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
        A = params["A"]
        return A / (k ** 2)

    elif demand_type == "step":
        values = params["values"]

        if k <= len(values):
            return values[k - 1]
        return 0

    else:
        raise ValueError(f"Unknown demand_type: {demand_type}")


def total_value(buyer, q):
    total = 0
    for k in range(1, q + 1):
        total += marginal_benefit(buyer, k)
    return total
