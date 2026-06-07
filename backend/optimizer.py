from demand import total_value


def find_best_q(buyer, gap, pricing_func, pricing_params):
    # Перебирает все допустимые объёмы и выбирает q*, максимизирующий U = V(q) - T(q)
    money = buyer["money"]

    best_result = {
        "q": 0,
        "value": 0,
        "payment": 0,
        "utility": 0,
        "consumer_surplus": 0
    }

    for q in range(0, gap + 1):
        value = total_value(buyer, q)
        payment = pricing_func(q, pricing_params, buyer)

        # Покупатель не может заплатить больше чем у него есть денег
        if payment > money:
            continue

        utility = value - payment
        consumer_surplus = utility

        # Выбираем q с максимальной полезностью, при равенстве - больший объём
        if (utility > best_result["utility"]
                or (utility == best_result["utility"] and q > best_result["q"])):
            best_result = {
                "q": q,
                "value": value,
                "payment": payment,
                "utility": utility,
                "consumer_surplus": consumer_surplus
            }

    return best_result
