import pc from 'picocolors'

export const logger = {
  success(message: string) {
    console.log(pc.green('✓'), message)
  },

  error(message: string) {
    console.error(pc.red('✗'), message)
  },

  warn(message: string) {
    console.warn(pc.yellow('⚠'), message)
  },

  info(message: string) {
    console.log(pc.cyan('ℹ'), message)
  },

  plain(message: string) {
    console.log(message)
  },

  section(title: string) {
    console.log()
    console.log(pc.bold(title))
    console.log(pc.gray('─'.repeat(50)))
  },

  list(items: string[]) {
    items.forEach((item) => console.log(pc.gray('  •'), item))
  },
}
