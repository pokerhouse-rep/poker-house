type EventHandler = (payload: unknown) => void | Promise<void>

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map()

  on(event: string, handler: EventHandler) {
    const existing = this.handlers.get(event) || []
    existing.push(handler)
    this.handlers.set(event, existing)
  }

  off(event: string, handler: EventHandler) {
    const existing = this.handlers.get(event) || []
    this.handlers.set(
      event,
      existing.filter((h) => h !== handler)
    )
  }

  async emit(event: string, payload: unknown) {
    const handlers = this.handlers.get(event) || []
    await Promise.allSettled(handlers.map((h) => h(payload)))
  }
}

export const eventBus = new EventBus()

export const Events = {
  LEDGER_TRANSACTION_CREATED: 'ledger.transaction.created',
  WALLET_DEPOSIT: 'wallet.deposit',
  WALLET_WITHDRAW: 'wallet.withdraw',
  WALLET_BALANCE_CHANGED: 'wallet.balance.changed',
  ACCOUNT_OPENED: 'account.opened',
  ACCOUNT_ITEM_ADDED: 'account.item.added',
  ACCOUNT_PAYMENT: 'account.payment',
  ACCOUNT_CLOSED: 'account.closed',
  ACCOUNT_SUGGESTION_CLOSE: 'account.suggestion.close',
  TOURNAMENT_ENTRY_REGISTERED: 'tournament.entry.registered',
  TOURNAMENT_REBUY: 'tournament.rebuy',
  TOURNAMENT_REENTRY: 'tournament.reentry',
  TOURNAMENT_ADDON: 'tournament.addon',
  TOURNAMENT_PLAYER_ELIMINATED: 'tournament.player.eliminated',
  TOURNAMENT_FINISHED: 'tournament.finished',
  TOURNAMENT_CANCELLED: 'tournament.cancelled',
  TOURNAMENT_PRIZE_PAID: 'tournament.prize.paid',
  TOURNAMENT_DEAL: 'tournament.deal.registered',
  CASH_PLAYER_SEATED: 'cash.player.seated',
  CASH_PLAYER_LEFT: 'cash.player.left',
  CASH_CHIPS_BOUGHT: 'cash.chips.bought',
  CASH_CHIPS_SOLD: 'cash.chips.sold',
  CASH_RAKE_REGISTERED: 'cash.rake.registered',
  TAB_ITEM_ADDED: 'tab.item.added',
  RANKING_RECALCULATED: 'ranking.recalculated',
  RAKEBACK_CREDITED: 'rakeback.credited',
  CASHREGISTER_OPENED: 'cashregister.opened',
  CASHREGISTER_CLOSED: 'cashregister.closed',
  NOTIFICATION_CREATED: 'notification.created',
} as const
