def hash_string(input_str: str) -> int:
    hash_value = 5381
    for char in input_str:
        code = ord(char)
        hash_value = (((hash_value << 5) + hash_value) ^ code) & 0xFFFFFFFF
    return hash_value % 100
