# canarygate

CanaryGate feature flags SDK for Python (server mode). Stdlib only.

## Installation

```
pip install canarygate
```

## Usage

```python
from canarygate import CanaryGate, Options

gate = CanaryGate("your-api-key", Options(environment="production"))
gate.init()

flag = gate.get_flag("feature-rollout-a", context=None)
if flag and flag.enabled:
    print(f"flag ativo ({flag.type})")

flags = gate.get_flags()
print(gate.is_stale(), gate.get_last_sync_at())
```

## Real-time updates (optional)

```python
from canarygate import CanaryGate, Options

gate = CanaryGate("your-api-key", Options(stream=True))
gate.init()

# flags são atualizadas em background via SSE

gate.disconnect()
```
