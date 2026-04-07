def calculate_cost(input_tokens,output_tokens):
    INPUT_PRICE_PER_TOKEN = 0.000005
    OUTPUT_PRICE_PER_TOKEN = 0.000015

    input_cost = input_tokens * INPUT_PRICE_PER_TOKEN
    output_cost = output_tokens * OUTPUT_PRICE_PER_TOKEN

    return input_cost + output_cost  