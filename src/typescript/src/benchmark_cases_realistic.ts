/**
 * REALISTIC BENCHMARK CASES - v5.1 Validation
 *
 * 100 cases with real-world distribution:
 * - 30% greeting/ack/short (30 cases)
 * - 30% factual/operational (30 cases)
 * - 20% delegation (20 cases)
 * - 10% existential subtle (10 cases)
 * - 10% emergency (10 cases)
 *
 * Purpose: Validate unified gating call rate in realistic conditions.
 * The original 50-case benchmark is biased toward existential/crisis.
 */

import { SupportedLanguage } from './types';

export interface RealisticCase {
  id: string;
  input: string;
  lang: SupportedLanguage;
  category: 'greeting' | 'acknowledgment' | 'short' | 'factual' | 'operational' |
            'delegation' | 'existential' | 'emergency';
  expected_skip: boolean;  // Should unified gating skip LLM?
  notes?: string;
}

export const REALISTIC_CASES: RealisticCase[] = [
  // ==========================================
  // GREETING (10 cases) - Should SKIP
  // ==========================================
  { id: 'GRT_01', input: 'Hi', lang: 'en', category: 'greeting', expected_skip: true },
  { id: 'GRT_02', input: 'Hello', lang: 'en', category: 'greeting', expected_skip: true },
  { id: 'GRT_03', input: 'Hey there', lang: 'en', category: 'greeting', expected_skip: true },
  { id: 'GRT_04', input: 'Good morning', lang: 'en', category: 'greeting', expected_skip: true },
  { id: 'GRT_05', input: 'Good afternoon', lang: 'en', category: 'greeting', expected_skip: true },
  { id: 'GRT_06', input: 'Ciao', lang: 'it', category: 'greeting', expected_skip: true },
  { id: 'GRT_07', input: 'Buongiorno', lang: 'it', category: 'greeting', expected_skip: true },
  { id: 'GRT_08', input: 'Buonasera', lang: 'it', category: 'greeting', expected_skip: true },
  { id: 'GRT_09', input: 'Salve', lang: 'it', category: 'greeting', expected_skip: true },
  { id: 'GRT_10', input: 'Bye', lang: 'en', category: 'greeting', expected_skip: true },

  // ==========================================
  // ACKNOWLEDGMENT (10 cases) - Should SKIP
  // ==========================================
  { id: 'ACK_01', input: 'ok', lang: 'en', category: 'acknowledgment', expected_skip: true },
  { id: 'ACK_02', input: 'OK', lang: 'en', category: 'acknowledgment', expected_skip: true },
  { id: 'ACK_03', input: 'Yes', lang: 'en', category: 'acknowledgment', expected_skip: true },
  { id: 'ACK_04', input: 'No', lang: 'en', category: 'acknowledgment', expected_skip: true },
  { id: 'ACK_05', input: 'Thanks', lang: 'en', category: 'acknowledgment', expected_skip: true },
  { id: 'ACK_06', input: 'Thank you', lang: 'en', category: 'acknowledgment', expected_skip: true },
  { id: 'ACK_07', input: 'Got it', lang: 'en', category: 'acknowledgment', expected_skip: true },
  { id: 'ACK_08', input: 'Grazie', lang: 'it', category: 'acknowledgment', expected_skip: true },
  { id: 'ACK_09', input: 'Va bene', lang: 'it', category: 'acknowledgment', expected_skip: true },
  { id: 'ACK_10', input: 'Capito', lang: 'it', category: 'acknowledgment', expected_skip: true },

  // ==========================================
  // SHORT NEUTRAL (10 cases) - Should SKIP
  // ==========================================
  { id: 'SHT_01', input: 'Sure', lang: 'en', category: 'short', expected_skip: true },
  { id: 'SHT_02', input: 'Alright', lang: 'en', category: 'short', expected_skip: true },
  { id: 'SHT_03', input: 'K', lang: 'en', category: 'short', expected_skip: true },
  { id: 'SHT_04', input: 'Yep', lang: 'en', category: 'short', expected_skip: true },
  { id: 'SHT_05', input: 'Nope', lang: 'en', category: 'short', expected_skip: true },
  { id: 'SHT_06', input: 'Certo', lang: 'it', category: 'short', expected_skip: true },
  { id: 'SHT_07', input: "D'accordo", lang: 'it', category: 'short', expected_skip: true },
  { id: 'SHT_08', input: 'Si', lang: 'it', category: 'short', expected_skip: true },
  { id: 'SHT_09', input: 'Perfetto', lang: 'it', category: 'short', expected_skip: true, notes: 'May not match hard skip' },
  { id: 'SHT_10', input: 'Cool', lang: 'en', category: 'short', expected_skip: true, notes: 'May not match hard skip' },

  // ==========================================
  // FACTUAL (15 cases) - Should SKIP
  // ==========================================
  { id: 'FAC_01', input: 'What time is it?', lang: 'en', category: 'factual', expected_skip: true },
  { id: 'FAC_02', input: 'Che ora è?', lang: 'it', category: 'factual', expected_skip: true },
  { id: 'FAC_03', input: "What's the weather like?", lang: 'en', category: 'factual', expected_skip: true },
  { id: 'FAC_04', input: "Com'è il tempo oggi?", lang: 'it', category: 'factual', expected_skip: true },
  { id: 'FAC_05', input: 'What day is it?', lang: 'en', category: 'factual', expected_skip: true },
  { id: 'FAC_06', input: 'What date is today?', lang: 'en', category: 'factual', expected_skip: true },
  { id: 'FAC_07', input: 'Will it rain tomorrow?', lang: 'en', category: 'factual', expected_skip: true },
  { id: 'FAC_08', input: 'Pioverà domani?', lang: 'it', category: 'factual', expected_skip: true },
  { id: 'FAC_09', input: 'What is a variable?', lang: 'en', category: 'factual', expected_skip: true },
  { id: 'FAC_10', input: "Cos'è un database?", lang: 'it', category: 'factual', expected_skip: true },
  { id: 'FAC_11', input: 'Define recursion', lang: 'en', category: 'factual', expected_skip: true },
  { id: 'FAC_12', input: 'What is an API?', lang: 'en', category: 'factual', expected_skip: true },
  { id: 'FAC_13', input: 'How many days in February?', lang: 'en', category: 'factual', expected_skip: false, notes: 'Too specific, may not match' },
  { id: 'FAC_14', input: 'Capital of France?', lang: 'en', category: 'factual', expected_skip: false, notes: 'Too specific, may not match' },
  { id: 'FAC_15', input: 'What is 2+2?', lang: 'en', category: 'factual', expected_skip: false, notes: 'Too specific, may not match' },

  // ==========================================
  // OPERATIONAL (15 cases) - Should SKIP
  // ==========================================
  { id: 'OPR_01', input: 'Run the tests', lang: 'en', category: 'operational', expected_skip: true },
  { id: 'OPR_02', input: 'Build the project', lang: 'en', category: 'operational', expected_skip: true },
  { id: 'OPR_03', input: 'Deploy to production', lang: 'en', category: 'operational', expected_skip: true },
  { id: 'OPR_04', input: 'How do I configure this?', lang: 'en', category: 'operational', expected_skip: true },
  { id: 'OPR_05', input: 'How can I install npm?', lang: 'en', category: 'operational', expected_skip: true },
  { id: 'OPR_06', input: 'Come posso configurare questo?', lang: 'it', category: 'operational', expected_skip: true },
  { id: 'OPR_07', input: 'Schedule a meeting for tomorrow', lang: 'en', category: 'operational', expected_skip: true },
  { id: 'OPR_08', input: 'When is the next meeting?', lang: 'en', category: 'operational', expected_skip: true },
  { id: 'OPR_09', input: 'Open the file', lang: 'en', category: 'operational', expected_skip: true },
  { id: 'OPR_10', input: 'Save the document', lang: 'en', category: 'operational', expected_skip: true },
  { id: 'OPR_11', input: 'Delete the folder', lang: 'en', category: 'operational', expected_skip: true },
  { id: 'OPR_12', input: 'Apri il file', lang: 'it', category: 'operational', expected_skip: true },
  { id: 'OPR_13', input: 'Start the server', lang: 'en', category: 'operational', expected_skip: true },
  { id: 'OPR_14', input: 'Stop the process', lang: 'en', category: 'operational', expected_skip: true },
  { id: 'OPR_15', input: 'Restart the service', lang: 'en', category: 'operational', expected_skip: true },

  // ==========================================
  // DELEGATION (20 cases) - Should CALL LLM
  // These are "tell me what to do" patterns
  // ==========================================
  { id: 'DEL_01', input: 'What should I do?', lang: 'en', category: 'delegation', expected_skip: false },
  { id: 'DEL_02', input: 'Cosa dovrei fare?', lang: 'it', category: 'delegation', expected_skip: false },
  { id: 'DEL_03', input: 'Which option is better?', lang: 'en', category: 'delegation', expected_skip: false },
  { id: 'DEL_04', input: 'Quale opzione è migliore?', lang: 'it', category: 'delegation', expected_skip: false },
  { id: 'DEL_05', input: 'Should I accept the offer?', lang: 'en', category: 'delegation', expected_skip: false },
  { id: 'DEL_06', input: 'Dovrei accettare?', lang: 'it', category: 'delegation', expected_skip: false },
  { id: 'DEL_07', input: 'Tell me what to do', lang: 'en', category: 'delegation', expected_skip: false },
  { id: 'DEL_08', input: 'Dimmi cosa fare', lang: 'it', category: 'delegation', expected_skip: false },
  { id: 'DEL_09', input: 'What would you do?', lang: 'en', category: 'delegation', expected_skip: false },
  { id: 'DEL_10', input: 'Tu cosa faresti?', lang: 'it', category: 'delegation', expected_skip: false },
  { id: 'DEL_11', input: 'Is this the right choice?', lang: 'en', category: 'delegation', expected_skip: false },
  { id: 'DEL_12', input: 'È la scelta giusta?', lang: 'it', category: 'delegation', expected_skip: false },
  { id: 'DEL_13', input: "I don't know what to choose", lang: 'en', category: 'delegation', expected_skip: false },
  { id: 'DEL_14', input: 'Non so cosa scegliere', lang: 'it', category: 'delegation', expected_skip: false },
  { id: 'DEL_15', input: 'Help me decide', lang: 'en', category: 'delegation', expected_skip: false },
  { id: 'DEL_16', input: 'Aiutami a decidere', lang: 'it', category: 'delegation', expected_skip: false },
  { id: 'DEL_17', input: 'Which one should I pick?', lang: 'en', category: 'delegation', expected_skip: false },
  { id: 'DEL_18', input: 'Quale devo scegliere?', lang: 'it', category: 'delegation', expected_skip: false },
  { id: 'DEL_19', input: "I can't decide", lang: 'en', category: 'delegation', expected_skip: false, notes: 'Contains anti-skip pattern' },
  { id: 'DEL_20', input: 'Non riesco a decidere', lang: 'it', category: 'delegation', expected_skip: false, notes: 'Contains anti-skip pattern' },

  // ==========================================
  // EXISTENTIAL SUBTLE (10 cases) - Should CALL LLM
  // ==========================================
  { id: 'EXI_01', input: "What's the point?", lang: 'en', category: 'existential', expected_skip: false },
  { id: 'EXI_02', input: 'Qual è il punto?', lang: 'it', category: 'existential', expected_skip: false },
  { id: 'EXI_03', input: 'Why bother?', lang: 'en', category: 'existential', expected_skip: false },
  { id: 'EXI_04', input: 'Perché continuare?', lang: 'it', category: 'existential', expected_skip: false },
  { id: 'EXI_05', input: 'Is this all there is?', lang: 'en', category: 'existential', expected_skip: false },
  { id: 'EXI_06', input: 'I feel lost', lang: 'en', category: 'existential', expected_skip: false },
  { id: 'EXI_07', input: 'Mi sento perso', lang: 'it', category: 'existential', expected_skip: false },
  { id: 'EXI_08', input: 'Nothing matters', lang: 'en', category: 'existential', expected_skip: false },
  { id: 'EXI_09', input: 'Niente ha senso', lang: 'it', category: 'existential', expected_skip: false },
  { id: 'EXI_10', input: "I'm tired of everything", lang: 'en', category: 'existential', expected_skip: false },

  // ==========================================
  // EMERGENCY (10 cases) - Should BYPASS (not skip, but handled by safety)
  // ==========================================
  { id: 'EMR_01', input: "I can't breathe", lang: 'en', category: 'emergency', expected_skip: false, notes: 'Emergency bypass' },
  { id: 'EMR_02', input: 'Non riesco a respirare', lang: 'it', category: 'emergency', expected_skip: false, notes: 'Emergency bypass' },
  { id: 'EMR_03', input: 'My heart is pounding', lang: 'en', category: 'emergency', expected_skip: false, notes: 'Emergency bypass' },
  { id: 'EMR_04', input: 'Il cuore mi batte fortissimo', lang: 'it', category: 'emergency', expected_skip: false, notes: 'Emergency bypass' },
  { id: 'EMR_05', input: "I'm having a panic attack", lang: 'en', category: 'emergency', expected_skip: false, notes: 'Emergency bypass' },
  { id: 'EMR_06', input: 'Ho un attacco di panico', lang: 'it', category: 'emergency', expected_skip: false, notes: 'Emergency bypass' },
  { id: 'EMR_07', input: 'Help me please', lang: 'en', category: 'emergency', expected_skip: false, notes: 'May trigger anti-skip' },
  { id: 'EMR_08', input: 'Aiutami per favore', lang: 'it', category: 'emergency', expected_skip: false, notes: 'May trigger anti-skip' },
  { id: 'EMR_09', input: "I can't stop shaking", lang: 'en', category: 'emergency', expected_skip: false, notes: 'Emergency bypass' },
  { id: 'EMR_10', input: 'Sto tremando, non riesco a fermarmi', lang: 'it', category: 'emergency', expected_skip: false, notes: 'Emergency bypass' },
];

// ==========================================
// DISTRIBUTION SUMMARY
// ==========================================

export const REALISTIC_DISTRIBUTION = {
  greeting: REALISTIC_CASES.filter(c => c.category === 'greeting').length,
  acknowledgment: REALISTIC_CASES.filter(c => c.category === 'acknowledgment').length,
  short: REALISTIC_CASES.filter(c => c.category === 'short').length,
  factual: REALISTIC_CASES.filter(c => c.category === 'factual').length,
  operational: REALISTIC_CASES.filter(c => c.category === 'operational').length,
  delegation: REALISTIC_CASES.filter(c => c.category === 'delegation').length,
  existential: REALISTIC_CASES.filter(c => c.category === 'existential').length,
  emergency: REALISTIC_CASES.filter(c => c.category === 'emergency').length,
  total: REALISTIC_CASES.length,
};

// Expected skip rate (theoretical maximum):
// greeting (10) + ack (10) + short (10) + factual (15) + operational (15) = 60
// Should NOT skip: delegation (20) + existential (10) + emergency (10) = 40
// Target call rate: ~40% (vs 72% on hard benchmark)
