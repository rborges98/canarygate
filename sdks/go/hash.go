package canarygate

// Hash computes the djb2 hash of input with unsigned 32-bit wrapping on every
// iteration and maps the result to the 0..99 range used for rollouts.
func Hash(input string) int {
	var hash uint32 = 5381
	for i := 0; i < len(input); i++ {
		hash = ((hash << 5) + hash) ^ uint32(input[i])
	}
	return int(hash % 100)
}
