package com.canarygate;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.assertEquals;

class HashTest {

    @ParameterizedTest
    @CsvSource({
            "'feature-rollout-a:user-42',59",
            "'new-checkout:vitor-1',20",
            "'dark-mode:anon-999',71",
            "'flag-x:',94"
    })
    void hashVectors(String input, int expected) {
        assertEquals(expected, Hash.hashString(input));
    }
}
