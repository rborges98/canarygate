package com.canarygate;

public final class Hash {

    private Hash() {
    }

    public static int hashString(String input) {
        int hash = 5381;
        for (int i = 0; i < input.length(); i++) {
            hash = ((hash << 5) + hash) ^ input.charAt(i);
        }
        return Integer.remainderUnsigned(hash, 100);
    }
}
