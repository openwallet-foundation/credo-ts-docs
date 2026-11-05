# Logging

> Log what a Credo agent does with the built-in ConsoleLogger or your own logger, and choose the log level.

A Credo agent logs nothing until you give it a logger. The agent and all its modules, including tenant agents, use that one logger.

## Console logger

Pass a logger as `config.logger`:

```ts
import { Agent, ConsoleLogger, LogLevel } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'

const agent = new Agent({
  config: {
    // Logs Info, Warn, Error and Fatal messages
    logger: new ConsoleLogger(LogLevel.Info),
  },
  dependencies: agentDependencies,
  modules: {
    ...storage, // Storage and key management, see Agent setup
  },
})
```

`ConsoleLogger` prints each message with its level as a prefix, such as `INFO: Creating agent with config`, using the console method that matches the level. Data passed with a message is printed as JSON. Errors in the data keep their message and stack.

## Log levels

A logger prints messages at its own level and above:

| Level | What Credo logs at this level |
| --- | --- |
| `LogLevel.Test` | Nothing. Set it to print every message. |
| `LogLevel.Trace` | The most detailed steps, such as key imports, and requests to ledgers and their results. |
| `LogLevel.Debug` | Processing steps of protocols, including the content of DIDComm messages the agent sends. |
| `LogLevel.Info` | Lifecycle events, such as the agent's config when it's created, storage updates, received DIDComm messages and created tenants. |
| `LogLevel.Warn` | Problems the agent recovers from, such as a credential that breaks a recommendation of its specification. |
| `LogLevel.Error` | Failed operations, such as a DIDComm message that can't be delivered. |
| `LogLevel.Fatal` | A storage update that failed. |
| `LogLevel.Off` | Nothing. The default. |

Use `Info` or higher in production. At `Debug` and `Trace`, logs can contain message contents, credential data and other personal data.

## Your own logger

To send logs to your own logging library, implement the `Logger` interface from `@credo-ts/core`: a `logLevel` property and the methods `test`, `trace`, `debug`, `info`, `warn`, `error` and `fatal`, each taking a `message` and optional `data`. Extending `BaseLogger` saves some work: it stores the level and has `isEnabled(level)`. This logger writes one JSON object per line:

```ts
import { BaseLogger, LogLevel, replaceError } from '@credo-ts/core'

type LogData = Record<string, unknown>

export class JsonLogger extends BaseLogger {
  private log(level: LogLevel, message: string, data?: LogData) {
    if (!this.isEnabled(level)) return

    // replaceError keeps the message and stack of errors, which JSON.stringify would drop
    console.log(JSON.stringify({ level: LogLevel[level], time: new Date().toISOString(), message, data }, replaceError))
  }

  public test(message: string, data?: LogData) {
    this.log(LogLevel.Test, message, data)
  }

  public trace(message: string, data?: LogData) {
    this.log(LogLevel.Trace, message, data)
  }

  public debug(message: string, data?: LogData) {
    this.log(LogLevel.Debug, message, data)
  }

  public info(message: string, data?: LogData) {
    this.log(LogLevel.Info, message, data)
  }

  public warn(message: string, data?: LogData) {
    this.log(LogLevel.Warn, message, data)
  }

  public error(message: string, data?: LogData) {
    this.log(LogLevel.Error, message, data)
  }

  public fatal(message: string, data?: LogData) {
    this.log(LogLevel.Fatal, message, data)
  }
}
```

Pass it as `config.logger`, for example `new JsonLogger(LogLevel.Info)`.
