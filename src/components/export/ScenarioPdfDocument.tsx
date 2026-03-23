import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.45,
    color: '#1a1a1a',
  },
  title: {
    fontSize: 16,
    marginBottom: 6,
    fontFamily: 'Helvetica-Bold',
  },
  meta: {
    fontSize: 9,
    color: '#444444',
    marginBottom: 3,
  },
  section: {
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.5,
  },
  disclaimer: {
    marginTop: 20,
    fontSize: 8,
    color: '#555555',
    lineHeight: 1.4,
  },
});

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
  const narrativeDisplay =
    narrative.trim() === '' ? 'No narrative generated yet — use the Narrative tab first.' : narrative;

  return (
    <Document>
      <Page size="LETTER" style={styles.page} wrap>
        <Text style={styles.title}>QMSR Inspection Readiness</Text>
        <Text style={styles.meta}>Generated {generatedAt}</Text>
        <Text style={styles.meta}>Educational output only — not legal or regulatory advice.</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scenario</Text>
          <Text style={styles.body}>Product / device: {productTitle}</Text>
          <Text style={styles.body}>Company: {companyLine}</Text>
          <Text style={styles.body}>Inspection type: {inspectionTypeLabel}</Text>
          <Text style={styles.body}>Readiness summary: {readinessLabel}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Primary product risk</Text>
          <Text style={styles.body}>{riskDisplay}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investigator outcome question (risk thread)</Text>
          <Text style={styles.body}>{investigatorQuestion}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inspection narrative</Text>
          <Text style={styles.body}>{narrativeDisplay}</Text>
        </View>

        <Text style={styles.disclaimer}>
          QMSR Inspection Readiness produces heuristic preparation materials under CP 7382.850
          themes. It does not predict FDA findings, enforcement, or inspection outcomes.
        </Text>
      </Page>
    </Document>
  );
}
