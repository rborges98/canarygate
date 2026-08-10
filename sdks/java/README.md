# CanaryGate Java SDK

Maven coordinate: `com.canarygate:sdk:0.1.0` (requires Java 17+)

## Install

```xml
<dependency>
  <groupId>com.canarygate</groupId>
  <artifactId>sdk</artifactId>
  <version>0.1.0</version>
</dependency>
```

## Usage

```java
import com.canarygate.CanaryGateClient;
import com.canarygate.Models.FlagData;
import com.canarygate.Models.FlagEvaluationContext;
import com.canarygate.Models.Options;

CanaryGateClient client = new CanaryGateClient("your-api-key", Options.defaults());
client.init();

FlagData flag = client.getFlag("feature-rollout-a", new FlagEvaluationContext("user-42"));
if (flag.enabled()) {
    System.out.println("Feature is enabled (percent: " + flag.percent() + ")");
}

for (FlagData f : client.getFlags(new FlagEvaluationContext("user-42"))) {
    System.out.println(f.key() + " -> " + f.enabled());
}

if (client.isStale()) {
    System.out.println("Data is stale, last sync at " + client.getLastSyncAt());
}

client.disconnect();
```

Enable real-time updates with `new Options(...)` where `stream` is `true` (SSE stream, opt-in; `init()` throws `IOException` if the initial snapshot fetch fails).
