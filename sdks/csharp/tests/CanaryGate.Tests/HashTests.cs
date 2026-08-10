using CanaryGate;
using Xunit;

namespace CanaryGate.Tests;

public class HashTests
{
    [Theory]
    [InlineData("feature-rollout-a:user-42", 59)]
    [InlineData("new-checkout:vitor-1", 20)]
    [InlineData("dark-mode:anon-999", 71)]
    [InlineData("flag-x:", 94)]
    public void HashString_Matches_Contract_Vectors(string input, int expected)
    {
        Assert.Equal(expected, Hash.HashString(input));
    }
}
