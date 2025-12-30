# ENOQ Standard Governance

**Version:** 1.0-draft

---

## 1. Governing Body

### 1.1 ENOQ Architecture Board

The ENOQ Architecture Board maintains this Standard.

**Responsibilities:**
- Review and approve Standard amendments
- Maintain reference implementation
- Certify Level 3 compliance
- Resolve interpretation disputes

### 1.2 Composition

The Board consists of:
- Original author(s)
- Invited technical experts
- Community representatives (when established)

---

## 2. Versioning

### 2.1 Semantic Versioning

The Standard follows semantic versioning (MAJOR.MINOR.PATCH):

| Change Type | Version Impact | Example |
|-------------|----------------|---------|
| Breaking change to normative requirements | MAJOR | 1.0 → 2.0 |
| New optional requirements | MINOR | 1.0 → 1.1 |
| Clarifications without normative change | MINOR | 1.0 → 1.1 |
| Editorial corrections | PATCH | 1.0.0 → 1.0.1 |

### 2.2 Draft Status

Documents marked "DRAFT" are not final. They MAY change without versioning until published as stable.

### 2.3 Stability Guarantees

Once published as stable:
- MAJOR versions: 24-month support minimum
- Deprecated features: 12-month notice

---

## 3. Amendment Process

### 3.1 Standard Amendments

To amend the Standard (non-axiom sections):

1. **Proposal**: Written document describing change and justification
2. **Comment Period**: 30 days for public review
3. **Board Review**: Technical assessment
4. **Vote**: Supermajority approval (>75% of Board)
5. **Publication**: Version increment and announcement

### 3.2 Axiom Amendments

To amend axioms (AXIS/AXIOMS.md):

1. All requirements from 3.1, plus:
2. **Extended Comment Period**: 90 days
3. **Justification**: Must demonstrate amendment does not violate axiom purpose
4. **Hash Update**: AXIS/HASH_FREEZE.md must be updated
5. **Migration Period**: Both versions valid during transition

**Note:** Axiom amendments are exceptional. The axioms are designed as infinite priors.

### 3.3 Emergency Amendments

For security vulnerabilities or critical defects:

1. Board may issue emergency patch
2. Abbreviated comment period (7 days)
3. Majority approval (>50%)
4. Must be ratified under normal process within 90 days

---

## 4. Interpretation

### 4.1 Disputes

Interpretation disputes are resolved by:

1. Reference to Standard text (primary)
2. Reference to AXIS documents (constitutional)
3. Reference to reference implementation behavior
4. Board ruling (final)

### 4.2 Precedent

Board rulings create precedent. Published rulings are binding for future interpretations unless explicitly overturned.

---

## 5. Contribution

### 5.1 Proposals

Anyone may submit proposals via:
- GitHub issues on reference implementation
- Direct communication to Board

### 5.2 Review

All proposals receive:
- Acknowledgment within 14 days
- Technical review within 60 days
- Decision communication with rationale

---

## 6. Trademark

### 6.1 ENOQ Name

"ENOQ" is a trademark. Usage requires:
- Level 3 compliance for products
- Attribution for documentation
- No implication of endorsement without certification

### 6.2 Compliance Claims

| Claim | Requirement |
|-------|-------------|
| "ENOQ-aligned" | Good faith alignment |
| "ENOQ Standard compliant (Level N)" | Verified compliance at Level N |
| "ENOQ certified" | Level 3 + Board certification |

---

## 7. Contact

For governance matters:
- GitHub: https://github.com/rossignoliluca/ENOQ-CORE
- Issues: Standard interpretation and proposals

---

*Governance exists to preserve the Standard's integrity, not to create bureaucracy.*
