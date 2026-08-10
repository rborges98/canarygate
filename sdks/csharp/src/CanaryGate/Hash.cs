namespace CanaryGate;

public static class Hash
{
    public static int HashString(string input)
    {
        var hash = 5381;
        for (var i = 0; i < input.Length; i++)
        {
            unchecked
            {
                hash = ((hash << 5) + hash) ^ input[i];
            }
        }
        return (int)((uint)hash % 100u);
    }
}
