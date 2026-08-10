package canarygate

import (
	"bufio"
	"io"
	"strconv"
	"strings"
)

// SseEvent is a parsed SSE event block.
type SseEvent struct {
	Event   string
	Data    string
	RetryMs *int
}

// ParseSse reads an SSE stream from r and invokes callback for each complete
// event block. Blocks are separated by blank lines (\n or \r\n); empty lines
// and comment lines starting with ":" are ignored, as are blocks that contain
// neither a data nor a retry field.
func ParseSse(r io.Reader, callback func(SseEvent)) error {
	br := bufio.NewReader(r)
	var lines []string

	for {
		line, err := br.ReadString('\n')
		line = strings.TrimSuffix(strings.TrimSuffix(line, "\n"), "\r")

		if line == "" {
			if block := parseSseBlock(lines); block != nil {
				callback(*block)
			}
			lines = nil
		} else {
			lines = append(lines, line)
		}

		if err == io.EOF {
			if block := parseSseBlock(lines); block != nil {
				callback(*block)
			}
			return nil
		}
		if err != nil {
			return err
		}
	}
}

func parseSseBlock(lines []string) *SseEvent {
	var event string
	var dataLines []string
	var retryMs *int

	for _, line := range lines {
		if line == "" || strings.HasPrefix(line, ":") {
			continue
		}

		var field, value string
		if idx := strings.IndexByte(line, ':'); idx >= 0 {
			field = line[:idx]
			value = strings.TrimLeft(line[idx+1:], " \t")
		} else {
			field = line
		}

		switch field {
		case "event":
			if value != "" {
				event = value
			}
		case "data":
			dataLines = append(dataLines, value)
		case "retry":
			if n, err := strconv.Atoi(value); err == nil && n > 0 {
				retryMs = &n
			}
		}
	}

	if len(dataLines) == 0 && retryMs == nil {
		return nil
	}
	if event == "" {
		event = "message"
	}
	return &SseEvent{
		Event:   event,
		Data:    strings.Join(dataLines, "\n"),
		RetryMs: retryMs,
	}
}
