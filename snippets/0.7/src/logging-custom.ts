import { AskarModule } from '@credo-ts/askar'
// start-section-1
import { Agent, BaseLogger, LogLevel, replaceError } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

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
// end-section-1

const agent = new Agent({
  config: {
    logger: new JsonLogger(LogLevel.Info),
  },
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      askar: NativeAskar,
      store: { id: 'logging-example', key: 'logging-example-key' },
    }),
  },
})

await agent.initialize()
agent.config.logger.error('Example error', { error: new Error('Something went wrong') })
await agent.shutdown()
