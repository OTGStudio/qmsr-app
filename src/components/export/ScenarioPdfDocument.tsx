import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';

/* ------------------------------------------------------------------ */
/*  Brand tokens                                                       */
/* ------------------------------------------------------------------ */
const BRAND = {
  navy: '#181612',
  accent: '#9c3f2f',
  accentLight: '#faeee9',
  muted: '#615a50',
  border: '#ddd6ca',
  bg: '#f8f7f4',
  cardAlt: '#f4f1eb',
  white: '#ffffff',
  text: '#181612',
};

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 60,
    paddingHorizontal: 0,
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    lineHeight: 1.5,
    color: BRAND.text,
    backgroundColor: BRAND.white,
  },

  /* ---- Header bar ---- */
  headerBar: {
    backgroundColor: BRAND.navy,
    paddingVertical: 20,
    paddingHorizontal: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.white,
    letterSpacing: 1.5,
  },
  appName: {
    fontSize: 9,
    color: '#b5ab9b',
    letterSpacing: 3,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerMeta: {
    fontSize: 8,
    color: '#b5ab9b',
  },

  /* ---- Content area ---- */
  content: {
    paddingHorizontal: 48,
    paddingTop: 24,
  },

  /* ---- Title stripe ---- */
  titleStripe: {
    backgroundColor: BRAND.accentLight,
    borderLeftWidth: 4,
    borderLeftColor: BRAND.accent,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  titleText: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.accent,
  },
  titleSub: {
    fontSize: 9,
    color: BRAND.muted,
    marginTop: 3,
  },

  /* ---- Scenario meta grid ---- */
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 0,
  },
  metaCell: {
    width: '50%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND.border,
  },
  metaLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.muted,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 10,
    color: BRAND.text,
  },

  /* ---- Section ---- */
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
    paddingBottom: 4,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND.accent,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.navy,
  },
  body: {
    fontSize: 9.5,
    lineHeight: 1.55,
    color: BRAND.text,
  },

  /* ---- Callout box (for risk / investigator Q) ---- */
  calloutBox: {
    backgroundColor: BRAND.cardAlt,
    borderLeftWidth: 3,
    borderLeftColor: BRAND.accent,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 4,
  },

  /* ---- Narrative markdown-ish rendering ---- */
  narrativeH1: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.navy,
    marginBottom: 6,
    marginTop: 14,
  },
  narrativeH2: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.accent,
    marginBottom: 4,
    marginTop: 12,
  },
  narrativeH3: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.navy,
    marginBottom: 4,
    marginTop: 10,
  },
  narrativeHr: {
    borderBottomWidth: 0.75,
    borderBottomColor: BRAND.border,
    marginVertical: 10,
  },
  narrativeParagraph: {
    fontSize: 9.5,
    lineHeight: 1.55,
    color: BRAND.text,
    marginBottom: 6,
  },
  narrativeBold: {
    fontFamily: 'Helvetica-Bold',
  },

  /* ---- Footer ---- */
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    paddingHorizontal: 48,
    borderTopWidth: 0.5,
    borderTopColor: BRAND.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    fontSize: 7,
    color: BRAND.muted,
  },
  footerRight: {
    fontSize: 7,
    color: BRAND.muted,
  },
  footerLink: {
    fontSize: 7,
    color: BRAND.accent,
    textDecoration: 'none',
  },

  /* ---- Disclaimer ---- */
  disclaimer: {
    marginTop: 24,
    backgroundColor: BRAND.bg,
    borderWidth: 0.5,
    borderColor: BRAND.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 3,
  },
  disclaimerText: {
    fontSize: 7.5,
    color: BRAND.muted,
    lineHeight: 1.45,
  },
});

/* ------------------------------------------------------------------ */
/*  Minimal markdown-to-nodes parser                                   */
/* ------------------------------------------------------------------ */

type NarrativeNode =
  | { type: 'h1'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'hr' }
  | { type: 'paragraph'; text: string };

function parseNarrativeMarkdown(raw: string): NarrativeNode[] {
  const lines = raw.split('\n');
  const nodes: NarrativeNode[] = [];
  let buffer = '';

  const flushBuffer = () => {
    const trimmed = buffer.trim();
    if (trimmed) {
      nodes.push({ type: 'paragraph', text: trimmed });
    }
    buffer = '';
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^---+$/.test(trimmed)) {
      flushBuffer();
      nodes.push({ type: 'hr' });
      continue;
    }
    if (trimmed.startsWith('### ')) {
      flushBuffer();
      nodes.push({ type: 'h3', text: trimmed.replace(/^###\s+/, '') });
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushBuffer();
      nodes.push({ type: 'h2', text: trimmed.replace(/^##\s+/, '') });
      continue;
    }
    if (trimmed.startsWith('# ')) {
      flushBuffer();
      nodes.push({ type: 'h1', text: trimmed.replace(/^#\s+/, '') });
      continue;
    }
    if (trimmed === '') {
      flushBuffer();
      continue;
    }

    buffer += (buffer ? ' ' : '') + trimmed;
  }
  flushBuffer();

  return nodes;
}

/** Render inline **bold** segments within a text string */
function renderInlineText(text: string, baseStyle: Style) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) {
    return <Text style={baseStyle}>{text}</Text>;
  }
  return (
    <Text style={baseStyle}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={i} style={styles.narrativeBold}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

function NarrativeContent({ text }: { text: string }) {
  const nodes = parseNarrativeMarkdown(text);
  return (
    <View>
      {nodes.map((node, i) => {
        switch (node.type) {
          case 'h1':
            return (
              <View key={i} wrap={false}>
                {renderInlineText(node.text, styles.narrativeH1)}
              </View>
            );
          case 'h2':
            return (
              <View key={i} wrap={false}>
                {renderInlineText(node.text, styles.narrativeH2)}
              </View>
            );
          case 'h3':
            return (
              <View key={i} wrap={false}>
                {renderInlineText(node.text, styles.narrativeH3)}
              </View>
            );
          case 'hr':
            return <View key={i} style={styles.narrativeHr} />;
          case 'paragraph':
            return <View key={i}>{renderInlineText(node.text, styles.narrativeParagraph)}</View>;
          default:
            return null;
        }
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Public interface                                                   */
/* ------------------------------------------------------------------ */

export interface ScenarioPdfDocumentProps {
  productTitle: string;
  companyLine: string;
  inspectionTypeLabel: string;
  readinessLabel: string;
  riskText: string;
  narrative: string;
  investigatorQuestion: string;
  generatedAt: string;
}

export function ScenarioPdfDocument({
  productTitle,
  companyLine,
  inspectionTypeLabel,
  readinessLabel,
  riskText,
  narrative,
  investigatorQuestion,
  generatedAt,
}: ScenarioPdfDocumentProps) {
  const riskDisplay = riskText.trim() === '' ? '(none entered)' : riskText;
  const narrativeEmpty = narrative.trim() === '';

  return (
    <Document>
      <Page size="LETTER" style={styles.page} wrap>
        {/* ---- Branded header ---- */}
        <View style={styles.headerBar} fixed>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>RESPRESS SOLUTIONS LLC</Text>
            <Text style={styles.appName}>QMSR INSPECTION READINESS</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerMeta}>Generated {generatedAt}</Text>
            <Text style={styles.headerMeta}>respresssolutions.com</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* ---- Title stripe ---- */}
          <View style={styles.titleStripe}>
            <Text style={styles.titleText}>Inspection Readiness Report</Text>
            <Text style={styles.titleSub}>
              CP 7382.850 Compliance Program | Educational Preparation Material
            </Text>
          </View>

          {/* ---- Scenario meta grid ---- */}
          <View style={styles.metaGrid}>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Product / Device</Text>
              <Text style={styles.metaValue}>{productTitle}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Company</Text>
              <Text style={styles.metaValue}>{companyLine}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Inspection Type</Text>
              <Text style={styles.metaValue}>{inspectionTypeLabel}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Readiness Summary</Text>
              <Text style={styles.metaValue}>{readinessLabel}</Text>
            </View>
          </View>

          {/* ---- Primary risk ---- */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>Primary Product Risk</Text>
            </View>
            <View style={styles.calloutBox}>{renderInlineText(riskDisplay, styles.body)}</View>
          </View>

          {/* ---- Investigator question ---- */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>Investigator Outcome Question</Text>
            </View>
            <View style={styles.calloutBox}>
              {renderInlineText(investigatorQuestion, styles.body)}
            </View>
          </View>

          {/* ---- Narrative ---- */}
          <View style={styles.section} break={!narrativeEmpty}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>Inspection Narrative</Text>
            </View>
            {narrativeEmpty ? (
              <Text style={[styles.body, { color: BRAND.muted, fontStyle: 'italic' }]}>
                No narrative generated yet — use the Narrative tab first.
              </Text>
            ) : (
              <NarrativeContent text={narrative} />
            )}
          </View>

          {/* ---- Disclaimer ---- */}
          <View style={styles.disclaimer} wrap={false}>
            <Text style={styles.disclaimerText}>
              DISCLAIMER: This document is produced by QMSR Inspection Readiness, a product of
              Respress Solutions LLC. It provides heuristic preparation materials under CP 7382.850
              themes for educational purposes only. It does not predict FDA findings, enforcement
              actions, or inspection outcomes. This document does not constitute legal, regulatory,
              or consulting advice and does not create a consulting relationship with Respress
              Solutions LLC.
            </Text>
          </View>
        </View>

        {/* ---- Footer ---- */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerLeft}>
            Respress Solutions LLC | contact@respresssolutions.com
          </Text>
          <Text
            style={styles.footerRight}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
