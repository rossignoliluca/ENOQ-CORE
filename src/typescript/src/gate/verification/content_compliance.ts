/**
 * CONTENT COMPLIANCE ENGINE (P2.1)
 *
 * Linguistic AXIS violation detection.
 * Blocks or replaces output that violates constitutional invariants.
 *
 * Four violation categories:
 * 1. NORMATIVE: devi/dovresti/ti consiglio/ti raccomando
 * 2. RANKING: "best", "migliore", "I recommend option A"
 * 3. ENGAGEMENT: "vuoi continuare?", "possiamo iterare"
 * 4. PERSUASION: soft nudging, leading questions
 *
 * Output: PASS | VIOLATION (with fallback or STOP)
 */

import { SupportedLanguage } from '../../interface/types';

// ============================================
// TYPES
// ============================================

export type ComplianceCategory =
  | 'NORMATIVE'      // Prescriptive language
  | 'RANKING'        // Best/worst, option recommendations
  | 'ENGAGEMENT'     // Dependency hooks, continuation requests
  | 'PERSUASION';    // Soft nudging, leading language

export interface ComplianceViolation {
  category: ComplianceCategory;
  pattern_id: string;
  matched_text: string;
  severity: 'warning' | 'block' | 'stop';
  invariant: string;
}

export interface ComplianceResult {
  passed: boolean;
  violations: ComplianceViolation[];
  action: 'DELIVER' | 'FALLBACK' | 'STOP';
  fallback_reason?: string;
}

// ============================================
// PATTERN DEFINITIONS
// ============================================

interface PatternDef {
  id: string;
  category: ComplianceCategory;
  severity: 'warning' | 'block' | 'stop';
  invariant: string;
  patterns: {
    en?: RegExp[];
    it?: RegExp[];
    es?: RegExp[];
    fr?: RegExp[];
    de?: RegExp[];
    // Universal patterns (language-agnostic)
    universal?: RegExp[];
  };
}

const COMPLIANCE_PATTERNS: PatternDef[] = [
  // ============================================
  // NORMATIVE LANGUAGE (INV-003)
  // ============================================
  {
    id: 'NORM-001',
    category: 'NORMATIVE',
    severity: 'stop',
    invariant: 'INV-003',
    patterns: {
      en: [
        /\byou should\b/i,
        /\byou must\b/i,
        /\byou need to\b/i,
        /\byou have to\b/i,
        /\byou ought to\b/i,
        /\bi advise you to\b/i,
        /\bi recommend (that )?(you|to)\b/i,
        /\bmy advice (is|would be)\b/i,
        /\bmy recommendation (is|would be)\b/i,
        /\bwhat you should do\b/i,
        /\bthe right thing (is|to do)\b/i,
      ],
      it: [
        /\bdevi\b/i,
        /\bdovresti\b/i,
        /\bbisogna che\b/i,
        /\bè necessario che\b/i,
        /\bti consiglio di\b/i,
        /\bti raccomando di\b/i,
        /\bil mio consiglio è\b/i,
        /\bla mia raccomandazione\b/i,
        /\bquello che devi fare\b/i,
        /\bla cosa giusta è\b/i,
      ],
      es: [
        /\bdebes\b/i,
        /\bdeberías\b/i,
        /\btienes que\b/i,
        /\bes necesario que\b/i,
        /\bte aconsejo\b/i,
        /\bte recomiendo\b/i,
        /\bmi consejo es\b/i,
        /\blo correcto es\b/i,
      ],
      fr: [
        /\btu dois\b/i,
        /\bvous devez\b/i,
        /\btu devrais\b/i,
        /\bvous devriez\b/i,
        /\bil faut que\b/i,
        /\bje te conseille\b/i,
        /\bje vous conseille\b/i,
        /\bmon conseil est\b/i,
        /\bla bonne chose à faire\b/i,
      ],
      de: [
        /\bdu musst\b/i,
        /\bdu solltest\b/i,
        /\bSie müssen\b/i,
        /\bSie sollten\b/i,
        /\bich rate dir\b/i,
        /\bich empfehle\b/i,
        /\bmein Rat ist\b/i,
        /\bdas Richtige ist\b/i,
      ],
    },
  },

  // ============================================
  // RANKING / OPTIMIZATION (INV-003)
  // ============================================
  {
    id: 'RANK-001',
    category: 'RANKING',
    severity: 'stop',
    invariant: 'INV-003',
    patterns: {
      en: [
        /\bthe best (choice|option|thing|decision|way)\b/i,
        /\bthe worst (choice|option|thing|decision)\b/i,
        /\bthe right (choice|option|decision)\b/i,
        /\bthe wrong (choice|option|decision)\b/i,
        /\boption (A|B|1|2) is (better|best|worse|worst)\b/i,
        /\bi (would )?recommend option\b/i,
        /\bi('d| would) (choose|pick|go with)\b/i,
        /\bthe obvious (choice|answer)\b/i,
        /\bclearly (the|option|you should)\b/i,
        /\bwithout a doubt\b/i,
        /\bdefinitely (choose|go with|pick)\b/i,
      ],
      it: [
        /\bla (scelta|opzione|cosa|decisione) migliore\b/i,
        /\bla (scelta|opzione|cosa|decisione) peggiore\b/i,
        /\bla scelta giusta\b/i,
        /\bla scelta sbagliata\b/i,
        /\bl'opzione (A|B|1|2) è (meglio|migliore|peggio)\b/i,
        /\bio (sceglierei|andrei con)\b/i,
        /\bla scelta ovvia\b/i,
        /\bchiaramente (la|dovresti)\b/i,
        /\bsenza dubbio\b/i,
        /\bsicuramente (scegli|vai con)\b/i,
      ],
      es: [
        /\bla mejor (opción|elección|cosa|decisión)\b/i,
        /\bla peor (opción|elección|cosa)\b/i,
        /\bla elección correcta\b/i,
        /\byo (elegiría|iría con)\b/i,
        /\bla opción obvia\b/i,
        /\bclaramente (la|deberías)\b/i,
        /\bsin duda\b/i,
      ],
      fr: [
        /\ble meilleur (choix|option)\b/i,
        /\ble pire (choix|option)\b/i,
        /\ble bon choix\b/i,
        /\bje (choisirais|prendrais)\b/i,
        /\ble choix évident\b/i,
        /\bclairement (le|tu devrais)\b/i,
        /\bsans aucun doute\b/i,
      ],
      de: [
        /\bdie beste (Wahl|Option|Entscheidung)\b/i,
        /\bdie schlechteste (Wahl|Option)\b/i,
        /\bdie richtige (Wahl|Entscheidung)\b/i,
        /\bich würde (wählen|nehmen)\b/i,
        /\bdie offensichtliche Wahl\b/i,
        /\beindeutig (die|du solltest)\b/i,
        /\bohne Zweifel\b/i,
      ],
    },
  },

  // ============================================
  // ENGAGEMENT HOOKS (INV-001 - No self-interest)
  // ============================================
  {
    id: 'ENGAGE-001',
    category: 'ENGAGEMENT',
    severity: 'block',
    invariant: 'INV-001',
    patterns: {
      en: [
        /\bwould you like (me to|to) continue\b/i,
        /\bshall (we|I) continue\b/i,
        /\blet me know if you (want|need) more\b/i,
        /\bcan we (explore|discuss|continue)\b/i,
        /\bwant to (hear|know|explore) more\b/i,
        /\bi can (help|assist) (you )?(further|more)\b/i,
        /\bcome back (tomorrow|later|anytime)\b/i,
        /\bwe('ll| will) continue (this|next time)\b/i,
        /\bi('ll| will) be here (for you|waiting)\b/i,
        /\bdon't hesitate to (ask|reach out|come back)\b/i,
      ],
      it: [
        /\bvuoi (che )?(continuo|continuiamo)\b/i,
        /\bpossiamo (continuare|esplorare|approfondire)\b/i,
        /\bfammi sapere se (vuoi|hai bisogno)\b/i,
        /\bvuoi (sapere|sentire) (di più|altro)\b/i,
        /\bposso (aiutarti|assisterti) (ancora|di più)\b/i,
        /\btorna (domani|più tardi|quando vuoi)\b/i,
        /\bcontinueremo (la prossima volta|domani)\b/i,
        /\bsarò qui (per te|ad aspettarti)\b/i,
        /\bnon esitare a (chiedere|tornare|contattarmi)\b/i,
      ],
      es: [
        /\b¿quieres que (continúe|continuemos)\b/i,
        /\bpodemos (continuar|explorar)\b/i,
        /\b¿quieres (saber|escuchar) más\b/i,
        /\bpuedo (ayudarte|asistirte) más\b/i,
        /\bvuelve (mañana|cuando quieras)\b/i,
        /\bestaré aquí (para ti|esperándote)\b/i,
        /\bno dudes en (preguntar|volver)\b/i,
      ],
      fr: [
        /\bvoulez-vous que (je continue|nous continuions)\b/i,
        /\bpouvons-nous (continuer|explorer)\b/i,
        /\bvoulez-vous en (savoir|entendre) plus\b/i,
        /\bje peux vous (aider|assister) davantage\b/i,
        /\brevenez (demain|quand vous voulez)\b/i,
        /\bje serai là (pour vous|à vous attendre)\b/i,
        /\bn'hésitez pas à (demander|revenir)\b/i,
      ],
      de: [
        /\bmöchtest du, dass ich (weitermache|fortfahre)\b/i,
        /\bkönnen wir (weitermachen|fortfahren)\b/i,
        /\bmöchtest du mehr (wissen|hören)\b/i,
        /\bich kann dir (weiter|mehr) helfen\b/i,
        /\bkomm (morgen|später|jederzeit) wieder\b/i,
        /\bich werde hier (sein|warten)\b/i,
        /\bzögere nicht (zu fragen|zurückzukommen)\b/i,
      ],
    },
  },

  // ============================================
  // PERSUASION CUES (INV-002 - User owns decisions)
  // ============================================
  {
    id: 'PERSUADE-001',
    category: 'PERSUASION',
    severity: 'block',
    invariant: 'INV-002',
    patterns: {
      en: [
        /\bdon't you think (that )?(you should|it would be)\b/i,
        /\bwouldn't it be (better|wiser|smarter) (if|to)\b/i,
        /\bif I were you\b/i,
        /\bin your (shoes|position|place), I would\b/i,
        /\bmost people (would|do|think)\b/i,
        /\beveryone (knows|says|agrees)\b/i,
        /\bit's obvious that\b/i,
        /\byou'll (regret|be sorry) if\b/i,
        /\byou don't want to\b.*\bdo you\b/i,
        /\btrust me (on this|when I say)\b/i,
        /\btake it from me\b/i,
        /\bbelieve me\b/i,
        /\bjust (think|imagine) how\b/i,
        /\bimagine how (good|great|much better)\b/i,
      ],
      it: [
        /\bnon pensi che (dovresti|sarebbe)\b/i,
        /\bnon sarebbe (meglio|più saggio) (se|che)\b/i,
        /\bse fossi in te\b/i,
        /\bal (tuo|posto tuo), io\b/i,
        /\bla maggior parte delle persone\b/i,
        /\btutti (sanno|dicono|concordano)\b/i,
        /\bè ovvio che\b/i,
        /\bti pentirai se\b/i,
        /\bnon vuoi\b.*\bvero\b/i,
        /\bfidati (di me|quando dico)\b/i,
        /\bcredimi\b/i,
        /\bimmagina (come|quanto)\b/i,
      ],
      es: [
        /\b¿no crees que (deberías|sería)\b/i,
        /\b¿no sería (mejor|más sabio)\b/i,
        /\bsi yo fuera tú\b/i,
        /\ben tu (lugar|posición), yo\b/i,
        /\bla mayoría de la gente\b/i,
        /\btodos (saben|dicen|están de acuerdo)\b/i,
        /\bes obvio que\b/i,
        /\bte arrepentirás si\b/i,
        /\bconfía en mí\b/i,
        /\bcréeme\b/i,
        /\bimagina cómo\b/i,
      ],
      fr: [
        /\btu ne penses pas que (tu devrais|ce serait)\b/i,
        /\bne serait-il pas (mieux|plus sage)\b/i,
        /\bsi j'étais (toi|à ta place)\b/i,
        /\bà ta place, je\b/i,
        /\bla plupart des gens\b/i,
        /\btout le monde (sait|dit|est d'accord)\b/i,
        /\bc'est évident que\b/i,
        /\btu regretteras si\b/i,
        /\bfais-moi confiance\b/i,
        /\bcrois-moi\b/i,
        /\bimagine comme\b/i,
      ],
      de: [
        /\bdenkst du nicht, dass (du solltest|es wäre)\b/i,
        /\bwäre es nicht (besser|klüger)\b/i,
        /\bwenn ich du wäre\b/i,
        /\ban deiner Stelle würde ich\b/i,
        /\bdie meisten Leute\b/i,
        /\bjeder (weiß|sagt|stimmt zu)\b/i,
        /\bes ist offensichtlich, dass\b/i,
        /\bdu wirst es bereuen, wenn\b/i,
        /\bvertrau mir\b/i,
        /\bglaub mir\b/i,
        /\bstell dir vor, wie\b/i,
      ],
    },
  },

  // ============================================
  // IDENTITY PRESCRIPTION (INV-009 - Rubicon)
  // ============================================
  {
    id: 'IDENTITY-001',
    category: 'NORMATIVE',
    severity: 'stop',
    invariant: 'INV-009',
    patterns: {
      en: [
        /\byou are (a|an) \w+ (person|type|kind)\b/i,
        /\byou're (being|acting) \w+\b/i,
        /\bthat's (just )?(who|how) you are\b/i,
        /\byour (true|real) (self|nature|identity) is\b/i,
        /\byou (have|suffer from) \w+ (disorder|syndrome|condition)\b/i,
        /\byou are (depressed|anxious|narcissistic|bipolar)\b/i,
      ],
      it: [
        /\bsei (un|una) (tipo|persona) \w+\b/i,
        /\bstai (essendo|facendo) \w+\b/i,
        /\bè così che sei\b/i,
        /\bil tuo vero (io|sé|natura) è\b/i,
        /\bhai (un|una) (disturbo|sindrome|condizione)\b/i,
        /\bsei (depresso|ansioso|narcisista|bipolare)\b/i,
      ],
      es: [
        /\beres (un|una) (tipo|persona) \w+\b/i,
        /\bestás (siendo|actuando) \w+\b/i,
        /\basí es como eres\b/i,
        /\btu verdadero (yo|ser|naturaleza) es\b/i,
        /\btienes (un|una) (trastorno|síndrome|condición)\b/i,
        /\beres (depresivo|ansioso|narcisista)\b/i,
      ],
    },
  },
];

// ============================================
// COMPLIANCE CHECK FUNCTION
// ============================================

/**
 * Check output against all compliance patterns
 *
 * @param output - The text to check
 * @param language - Primary language of the output
 * @returns ComplianceResult with violations and action
 */
export function checkCompliance(
  output: string,
  language: SupportedLanguage = 'en'
): ComplianceResult {
  const violations: ComplianceViolation[] = [];

  // Map language to pattern key
  const langKey = mapLanguageToKey(language);

  for (const patternDef of COMPLIANCE_PATTERNS) {
    // Get patterns for this language + universal
    const langPatterns = patternDef.patterns[langKey] || [];
    const universalPatterns = patternDef.patterns.universal || [];
    const allPatterns = [...langPatterns, ...universalPatterns];

    // Also check English patterns as fallback (many multilingual outputs mix English)
    const enPatterns = langKey !== 'en' ? (patternDef.patterns.en || []) : [];
    const patternsToCheck = [...allPatterns, ...enPatterns];

    for (const pattern of patternsToCheck) {
      const match = output.match(pattern);
      if (match) {
        violations.push({
          category: patternDef.category,
          pattern_id: patternDef.id,
          matched_text: match[0],
          severity: patternDef.severity,
          invariant: patternDef.invariant,
        });
        // One match per pattern definition is enough
        break;
      }
    }
  }

  // Determine action based on violations
  const action = determineAction(violations);

  return {
    passed: violations.length === 0,
    violations,
    action,
    fallback_reason: violations.length > 0
      ? `${violations[0].category}: ${violations[0].matched_text} (${violations[0].invariant})`
      : undefined,
  };
}

/**
 * Map SupportedLanguage to pattern key
 */
function mapLanguageToKey(lang: SupportedLanguage): keyof PatternDef['patterns'] {
  switch (lang) {
    case 'en': return 'en';
    case 'it': return 'it';
    case 'es': return 'es';
    case 'fr': return 'fr';
    case 'de': return 'de';
    // For languages without explicit patterns, use English
    default: return 'en';
  }
}

/**
 * Determine action based on violation severities
 */
function determineAction(violations: ComplianceViolation[]): 'DELIVER' | 'FALLBACK' | 'STOP' {
  if (violations.length === 0) {
    return 'DELIVER';
  }

  // Any 'stop' severity → STOP
  if (violations.some(v => v.severity === 'stop')) {
    return 'STOP';
  }

  // 'block' severity → FALLBACK
  if (violations.some(v => v.severity === 'block')) {
    return 'FALLBACK';
  }

  // 'warning' only → still FALLBACK for safety
  return 'FALLBACK';
}

// ============================================
// QUICK CHECK FUNCTIONS
// ============================================

/**
 * Quick check if output passes compliance
 */
export function isCompliant(output: string, language?: SupportedLanguage): boolean {
  return checkCompliance(output, language).passed;
}

/**
 * Get all violations for an output
 */
export function getViolations(
  output: string,
  language?: SupportedLanguage
): ComplianceViolation[] {
  return checkCompliance(output, language).violations;
}

/**
 * Check if output should trigger STOP
 */
export function shouldStop(output: string, language?: SupportedLanguage): boolean {
  return checkCompliance(output, language).action === 'STOP';
}

// ============================================
// PATTERN STATS (for testing/debugging)
// ============================================

export function getPatternStats(): {
  total_patterns: number;
  by_category: Record<ComplianceCategory, number>;
  by_language: Record<string, number>;
} {
  let total = 0;
  const byCategory: Record<string, number> = {
    NORMATIVE: 0,
    RANKING: 0,
    ENGAGEMENT: 0,
    PERSUASION: 0,
  };
  const byLanguage: Record<string, number> = {
    en: 0,
    it: 0,
    es: 0,
    fr: 0,
    de: 0,
    universal: 0,
  };

  for (const def of COMPLIANCE_PATTERNS) {
    for (const [lang, patterns] of Object.entries(def.patterns)) {
      const count = (patterns as RegExp[])?.length || 0;
      total += count;
      byCategory[def.category] = (byCategory[def.category] || 0) + count;
      byLanguage[lang] = (byLanguage[lang] || 0) + count;
    }
  }

  return {
    total_patterns: total,
    by_category: byCategory as Record<ComplianceCategory, number>,
    by_language: byLanguage,
  };
}
