import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EventInfo {
  id: number;
  organizer: string;
  name: string;
  ticketPrice: number; // in XLM units
  maxTickets: number;
  soldTickets: number;
  date: number; // Unix timestamp
  status: 0 | 1 | 2; // 0: Open, 1: Cancelled, 2: Completed
}

export interface TicketInfo {
  id: number;
  eventId: number;
  owner: string;
  originalBuyer: string;
  verified: boolean;
}

export interface LedgerActivity {
  id: string;
  timestamp: number;
  type: 'event_created' | 'ticket_purchased' | 'ticket_transferred' | 'ticket_verified' | 'event_cancelled' | 'event_completed' | 'funds_withdrawn';
  details: string;
  txHash: string;
}

export interface TransactionStatus {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'confirmed' | 'failed';
  timestamp: number;
  txHash?: string;
}

interface TicketStore {
  // Wallet & Config
  walletAddress: string | null;
  walletConnected: boolean;
  walletName: string | null;
  networkMode: 'simulator' | 'testnet';
  tokenBalance: number;
  managerContractId: string;
  escrowContractId: string;

  // ── SIMULATOR DATA (never touches blockchain) ──
  simEvents: EventInfo[];
  simTickets: TicketInfo[];
  simVerifiers: Record<number, string[]>;

  // ── TESTNET DATA (only real on-chain data) ──
  testnetEvents: EventInfo[];
  testnetTickets: TicketInfo[];

  // Telemetry & Feed
  activities: LedgerActivity[];
  transactions: TransactionStatus[];

  // Setters & Connection Actions
  connectWallet: (address: string, walletName: string) => void;
  disconnectWallet: () => void;
  setNetworkMode: (mode: 'simulator' | 'testnet') => void;
  setContractIds: (managerId: string, escrowId: string) => void;
  updateTokenBalance: (balance: number) => void;

  // Transaction Logging
  addTransaction: (tx: Omit<TransactionStatus, 'timestamp'>) => void;
  updateTransaction: (id: string, status: TransactionStatus['status'], txHash?: string) => void;
  addActivity: (activity: Omit<LedgerActivity, 'id' | 'timestamp' | 'txHash'>) => void;

  // ── TESTNET MUTATIONS (on-chain data only) ──
  addTestnetEvent: (event: EventInfo) => void;
  addTestnetTickets: (tickets: TicketInfo[]) => void;
  updateTestnetEventSoldCount: (eventId: number, quantity: number) => void;
  updateTestnetTicketVerified: (ticketId: number) => void;
  purgeInvalidTestnetEvents: () => void;

  // ── SIMULATOR MUTATIONS (local memory only) ──
  simCreateEvent: (name: string, price: number, maxTickets: number, date: number, forcedId?: number) => number;
  simPurchaseTicket: (eventId: number, quantity: number) => void;
  simTransferTicket: (ticketId: number, toAddress: string) => void;
  simVerifyTicket: (ticketId: number) => void;
  simAddVerifier: (eventId: number, verifier: string) => void;
  simCancelEvent: (eventId: number) => void;
  simCompleteEvent: (eventId: number) => void;
  simClaimRefund: (eventId: number, ticketId: number) => void;
}

// ── SIMULATOR SEED DATA (never shown in Testnet mode) ──
const defaultSimEvents: EventInfo[] = [
  {
    id: 1,
    organizer: 'GDG6XORGANIZER...TESTNET',
    name: 'Stellar Orange Belt Developer Summit 2026',
    ticketPrice: 25,
    maxTickets: 100,
    soldTickets: 42,
    date: Math.floor(Date.now() / 1000) + 86400 * 30,
    status: 0,
  },
  {
    id: 2,
    organizer: 'GABCONCERT...TESTNET',
    name: 'Soroban Smart Contract Beats & Bass',
    ticketPrice: 15,
    maxTickets: 50,
    soldTickets: 50,
    date: Math.floor(Date.now() / 1000) + 86400 * 15,
    status: 0,
  },
  {
    id: 3,
    organizer: 'GCELES...TESTNET',
    name: 'Web3 TicketChain Grand Gala',
    ticketPrice: 150,
    maxTickets: 15,
    soldTickets: 8,
    date: Math.floor(Date.now() / 1000) + 86400 * 5,
    status: 0,
  },
];

export const useTicketStore = create<TicketStore>()(
  persist(
    (set, get) => ({
      // ── WALLET & CONFIG ──
      walletAddress: null,
      walletConnected: false,
      walletName: null,
      networkMode: 'testnet', // Always default to testnet
      tokenBalance: 0,
      managerContractId: import.meta.env.VITE_TICKET_MANAGER_CONTRACT || 'CA5PG7SDYI7X6AJMRBX6DZL5LA4YT5I7WECPH347FDSSOBDU73GUZ76O',
      escrowContractId: import.meta.env.VITE_TICKET_ESCROW_CONTRACT || 'CCHIMKSGFIOLMENQCLWSADERPFKFSMTLOWTWUYARBE6J4FGS6BKSY3S3',

      // ── SIMULATOR DATA ──
      simEvents: defaultSimEvents,
      simTickets: [],
      simVerifiers: {
        1: ['GDG6XORGANIZER...TESTNET'],
        2: ['GABCONCERT...TESTNET'],
        3: ['GCELES...TESTNET'],
      },

      // ── TESTNET DATA (empty until events are created on-chain) ──
      testnetEvents: [],
      testnetTickets: [],

      activities: [
        {
          id: 'act_1',
          timestamp: Date.now() - 3600000 * 4,
          type: 'event_created',
          details: 'TicketChain platform initialized on Stellar Testnet.',
          txHash: '0x8fa3...d8ea',
        },
      ],
      transactions: [],

      // ── WALLET ACTIONS ──
      connectWallet: (address, walletName) => {
        const currentSimTickets = get().simTickets;

        // Seed simulator tickets for this wallet if in simulator mode and no tickets exist yet
        let newSimTickets = [...currentSimTickets];
        if (
          get().networkMode === 'simulator' &&
          currentSimTickets.filter((t) => t.owner === address).length === 0
        ) {
          newSimTickets = [
            ...currentSimTickets,
            { id: 101, eventId: 1, owner: address, originalBuyer: address, verified: false },
            { id: 102, eventId: 3, owner: address, originalBuyer: address, verified: true },
          ];
        }

        set({
          walletAddress: address,
          walletConnected: true,
          walletName,
          simTickets: newSimTickets,
        });

        get().addTransaction({
          id: `tx_${Date.now()}`,
          label: `Connect ${walletName} Wallet`,
          status: 'confirmed',
        });
      },

      disconnectWallet: () => {
        set({
          walletAddress: null,
          walletConnected: false,
          walletName: null,
          tokenBalance: 0,
          testnetTickets: [],
          transactions: [],
          activities: [],
        });
        try {
          localStorage.removeItem('ticketchain-storage');
          sessionStorage.clear();
        } catch (e) {
          console.error('Error clearing storage on disconnect:', e);
        }
      },

      setNetworkMode: (mode) => set({ networkMode: mode }),
      setContractIds: (managerId, escrowId) => set({ managerContractId: managerId, escrowContractId: escrowId }),
      updateTokenBalance: (balance) => set({ tokenBalance: balance }),

      // ── TESTNET MUTATIONS ──
      addTestnetEvent: (event) => {
        set((state) => ({
          testnetEvents: [...state.testnetEvents.filter((e) => e.id !== event.id), event],
          activities: [
            {
              id: `act_${Date.now()}`,
              timestamp: Date.now(),
              type: 'event_created' as const,
              details: `On-chain event "${event.name}" (ID: ${event.id}) created by ${event.organizer.slice(0, 8)}...`,
              txHash: '0x_testnet_' + Math.random().toString(36).substr(2, 8),
            },
            ...state.activities,
          ].slice(0, 30),
        }));
      },

      addTestnetTickets: (tickets) => {
        set((state) => ({
          testnetTickets: [...state.testnetTickets, ...tickets],
        }));
      },

      updateTestnetEventSoldCount: (eventId, quantity) => {
        set((state) => ({
          testnetEvents: state.testnetEvents.map((e) =>
            e.id === eventId ? { ...e, soldTickets: e.soldTickets + quantity } : e
          ),
        }));
      },

      updateTestnetTicketVerified: (ticketId) => {
        set((state) => ({
          testnetTickets: state.testnetTickets.map((t) =>
            t.id === ticketId ? { ...t, verified: true } : t
          ),
        }));
      },

      purgeInvalidTestnetEvents: () => {
        set((state) => ({
          testnetEvents: state.testnetEvents.filter((e) => e.id > 0),
          testnetTickets: state.testnetTickets.filter((t) => t.eventId > 0 && t.id > 0),
        }));
      },

      // ── TRANSACTION LOGGING ──
      addTransaction: (tx) => {
        const newTx: TransactionStatus = {
          ...tx,
          timestamp: Date.now(),
        };
        set((state) => ({
          transactions: [newTx, ...state.transactions].slice(0, 20),
        }));
      },

      updateTransaction: (id, status, txHash) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, status, txHash: txHash || t.txHash } : t
          ),
        }));
      },

      addActivity: (activity) => {
        const newActivity: LedgerActivity = {
          ...activity,
          id: `act_${Date.now()}`,
          timestamp: Date.now(),
          txHash: '0x' + Math.random().toString(16).substr(2, 8) + '...' + Math.random().toString(16).substr(2, 8),
        };
        set((state) => ({
          activities: [newActivity, ...state.activities].slice(0, 30),
        }));
      },

      // ── SIMULATOR MUTATIONS (local memory — never touches blockchain) ──
      simCreateEvent: (name, price, maxTickets, date, forcedId) => {
        const organizer = get().walletAddress || 'G_SIMULATED_USER...TESTNET';
        const newId = forcedId !== undefined ? forcedId : get().simEvents.length + 1;
        const newEvent: EventInfo = {
          id: newId,
          organizer,
          name,
          ticketPrice: price,
          maxTickets,
          soldTickets: 0,
          date,
          status: 0,
        };

        set((state) => ({
          simEvents: [...state.simEvents, newEvent],
          simVerifiers: {
            ...state.simVerifiers,
            [newId]: [organizer],
          },
        }));

        get().addActivity({
          type: 'event_created',
          details: `[Sim] Event "${name}" (ID: ${newId}) created by ${organizer.slice(0, 8)}...`,
        });

        return newId;
      },

      simPurchaseTicket: (eventId, quantity) => {
        const buyer = get().walletAddress || 'G_SIMULATED_USER...TESTNET';
        const event = get().simEvents.find((e) => e.id === eventId);
        if (!event) return;

        const totalCost = event.ticketPrice * quantity;
        if (get().tokenBalance < totalCost) {
          throw new Error('Insufficient simulated balance');
        }

        const currentCounter = get().simTickets.length + 200;
        const newTickets: TicketInfo[] = [];

        for (let i = 0; i < quantity; i++) {
          newTickets.push({
            id: currentCounter + i,
            eventId,
            owner: buyer,
            originalBuyer: buyer,
            verified: false,
          });
        }

        set((state) => ({
          tokenBalance: state.tokenBalance - totalCost,
          simTickets: [...state.simTickets, ...newTickets],
          simEvents: state.simEvents.map((e) =>
            e.id === eventId ? { ...e, soldTickets: e.soldTickets + quantity } : e
          ),
        }));

        get().addActivity({
          type: 'ticket_purchased',
          details: `[Sim] ${buyer.slice(0, 8)}... purchased ${quantity} tickets for "${event.name}"`,
        });
      },

      simTransferTicket: (ticketId, toAddress) => {
        const from = get().walletAddress || '';
        set((state) => ({
          simTickets: state.simTickets.map((t) =>
            t.id === ticketId ? { ...t, owner: toAddress } : t
          ),
        }));

        get().addActivity({
          type: 'ticket_transferred',
          details: `[Sim] Ticket #${ticketId} transferred from ${from.slice(0, 8)}... to ${toAddress.slice(0, 8)}...`,
        });
      },

      simVerifyTicket: (ticketId) => {
        const verifier = get().walletAddress || 'G_SIMULATED_VERIFIER';
        set((state) => ({
          simTickets: state.simTickets.map((t) =>
            t.id === ticketId ? { ...t, verified: true } : t
          ),
        }));

        get().addActivity({
          type: 'ticket_verified',
          details: `[Sim] Ticket #${ticketId} verified at gate by ${verifier.slice(0, 8)}...`,
        });
      },

      simAddVerifier: (eventId, verifier) => {
        const currentVerifiers = get().simVerifiers[eventId] || [];
        if (currentVerifiers.includes(verifier)) return;

        set((state) => ({
          simVerifiers: {
            ...state.simVerifiers,
            [eventId]: [...currentVerifiers, verifier],
          },
        }));

        get().addActivity({
          type: 'event_created',
          details: `[Sim] Address ${verifier.slice(0, 8)}... added as verifier for Event ID ${eventId}`,
        });
      },

      simCancelEvent: (eventId) => {
        const event = get().simEvents.find((e) => e.id === eventId);
        if (!event) return;

        set((state) => ({
          simEvents: state.simEvents.map((e) =>
            e.id === eventId ? { ...e, status: 1 } : e
          ),
        }));

        get().addActivity({
          type: 'event_cancelled',
          details: `[Sim] Event "${event.name}" (ID: ${eventId}) cancelled. Refunds enabled!`,
        });
      },

      simCompleteEvent: (eventId) => {
        const organizer = get().walletAddress || '';
        const event = get().simEvents.find((e) => e.id === eventId);
        if (!event) return;

        const payout = event.ticketPrice * event.soldTickets;
        set((state) => ({
          simEvents: state.simEvents.map((e) =>
            e.id === eventId ? { ...e, status: 2 } : e
          ),
          tokenBalance: event.organizer === organizer ? state.tokenBalance + payout : state.tokenBalance,
        }));

        get().addActivity({
          type: 'event_completed',
          details: `[Sim] Event "${event.name}" completed. Released ${payout} XLM to organizer.`,
        });
      },

      simClaimRefund: (eventId, ticketId) => {
        const buyer = get().walletAddress || '';
        const ticket = get().simTickets.find((t) => t.id === ticketId);
        const event = get().simEvents.find((e) => e.id === eventId);
        if (!ticket || !event) return;
        if (ticket.owner !== buyer || event.status !== 1) return;

        set((state) => ({
          tokenBalance: state.tokenBalance + event.ticketPrice,
          simTickets: state.simTickets.filter((t) => t.id !== ticketId),
        }));

        get().addActivity({
          type: 'funds_withdrawn',
          details: `[Sim] ${buyer.slice(0, 8)}... claimed refund of ${event.ticketPrice} XLM for Ticket #${ticketId}`,
        });
      },
    }),
    {
      name: 'ticketchain-storage-v2', // New storage key to avoid corrupted legacy data
      partialize: (state) => ({
        // Persist wallet state
        walletAddress: state.walletAddress,
        walletConnected: state.walletConnected,
        walletName: state.walletName,
        tokenBalance: state.tokenBalance,
        // Persist contract config
        managerContractId: state.managerContractId,
        escrowContractId: state.escrowContractId,
        networkMode: state.networkMode,
        // Persist separated event/ticket stores
        simEvents: state.simEvents,
        simTickets: state.simTickets,
        simVerifiers: state.simVerifiers,
        testnetEvents: state.testnetEvents,
        testnetTickets: state.testnetTickets,
        // Persist telemetry
        activities: state.activities,
      }),
    }
  )
);
