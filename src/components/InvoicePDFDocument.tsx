import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { Invoice } from '../types/billing';
import { CompanySettings } from '../hooks/useCompanySettings';

// Register Inter font
Font.register({
    family: 'Inter',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2', fontWeight: 400 },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2', fontWeight: 600 },
    ]
});

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Inter',
        fontSize: 10,
        color: '#334155',
        backgroundColor: '#ffffff'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0'
    },
    companyInfo: {
        flex: 1
    },
    companyName: {
        fontSize: 14,
        fontWeight: 600,
        color: '#0f172a',
        marginBottom: 4
    },
    companyDetail: {
        fontSize: 9,
        color: '#64748b',
        marginBottom: 2
    },
    documentInfo: {
        alignItems: 'flex-end'
    },
    documentTitle: {
        fontSize: 22,
        fontWeight: 600,
        color: '#10b981',
        marginBottom: 6
    },
    documentNumber: {
        fontSize: 12,
        fontWeight: 600,
        color: '#0f172a',
        marginBottom: 4
    },
    documentDate: {
        fontSize: 9,
        color: '#64748b'
    },
    clientSection: {
        marginBottom: 30,
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 6
    },
    sectionLabel: {
        fontSize: 8,
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8
    },
    clientName: {
        fontSize: 12,
        fontWeight: 600,
        color: '#0f172a',
        marginBottom: 4
    },
    clientDetail: {
        fontSize: 9,
        color: '#64748b',
        marginBottom: 2
    },
    table: {
        marginBottom: 24
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        padding: 10,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4
    },
    tableHeaderCell: {
        fontSize: 8,
        fontWeight: 600,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    tableRow: {
        flexDirection: 'row',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    tableCell: {
        fontSize: 9,
        color: '#334155'
    },
    colConcept: { flex: 4 },
    colBase: { flex: 1, textAlign: 'right' },
    colIvaRate: { flex: 0.8, textAlign: 'right' },
    colIvaAmount: { flex: 1, textAlign: 'right' },
    colTotal: { flex: 1.2, textAlign: 'right' },
    totalsSection: {
        marginLeft: 'auto',
        width: 200,
        marginBottom: 30
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    totalLabel: {
        fontSize: 9,
        color: '#64748b'
    },
    totalValue: {
        fontSize: 10,
        color: '#0f172a'
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        backgroundColor: '#10b981',
        paddingHorizontal: 12,
        borderRadius: 4,
        marginTop: 8
    },
    grandTotalLabel: {
        fontSize: 10,
        fontWeight: 600,
        color: '#ffffff'
    },
    grandTotalValue: {
        fontSize: 12,
        fontWeight: 600,
        color: '#ffffff'
    },
    notesSection: {
        marginBottom: 30,
        padding: 12,
        backgroundColor: '#f0fdf4',
        borderRadius: 4
    },
    notesText: {
        fontSize: 9,
        color: '#166534'
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#94a3b8'
    },
    draftWatermark: {
        position: 'absolute',
        top: '40%',
        left: '20%',
        fontSize: 60,
        color: '#e2e8f0',
        transform: 'rotate(-30deg)',
        opacity: 0.5
    }
});

interface InvoicePDFProps {
    invoice: Invoice;
    company: CompanySettings;
}

const formatCurrency = (value: number): string => {
    return value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
};

const InvoicePDFDocument: React.FC<InvoicePDFProps> = ({ invoice, company }) => {
    const isDraft = invoice.status === 'draft';
    const displayDate = invoice.issuedAt || invoice.createdAt;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Draft Watermark */}
                {isDraft && (
                    <Text style={styles.draftWatermark}>BORRADOR</Text>
                )}

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>{company.name}</Text>
                        <Text style={styles.companyDetail}>NIF: {company.nif}</Text>
                        <Text style={styles.companyDetail}>{company.address}</Text>
                        {company.city && (
                            <Text style={styles.companyDetail}>
                                {company.postalCode} {company.city}
                            </Text>
                        )}
                        {company.phone && <Text style={styles.companyDetail}>Tel: {company.phone}</Text>}
                        {company.email && <Text style={styles.companyDetail}>{company.email}</Text>}
                    </View>
                    <View style={styles.documentInfo}>
                        <Text style={styles.documentTitle}>FACTURA</Text>
                        <Text style={styles.documentNumber}>
                            {invoice.number || 'BORRADOR'}
                        </Text>
                        <Text style={styles.documentDate}>
                            Fecha: {new Date(displayDate).toLocaleDateString('es-ES')}
                        </Text>
                    </View>
                </View>

                {/* Client Section */}
                <View style={styles.clientSection}>
                    <Text style={styles.sectionLabel}>Cliente</Text>
                    <Text style={styles.clientName}>
                        {invoice.clientName || 'Sin cliente asignado'}
                    </Text>
                    {invoice.clientIdentity && (
                        <Text style={styles.clientDetail}>NIF/CIF: {invoice.clientIdentity}</Text>
                    )}
                    {invoice.clientAddress && (
                        <Text style={styles.clientDetail}>{invoice.clientAddress}</Text>
                    )}
                    {invoice.expedienteNumero && (
                        <Text style={styles.clientDetail}>Expediente: {invoice.expedienteNumero}</Text>
                    )}
                    {invoice.paymentMethod && (
                        <Text style={[styles.clientDetail, { marginTop: 4, fontWeight: 600 }]}>Forma de Pago: {invoice.paymentMethod}</Text>
                    )}
                </View>

                {/* Lines Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, styles.colConcept]}>Concepto</Text>
                        <Text style={[styles.tableHeaderCell, styles.colBase]}>Base</Text>
                        <Text style={[styles.tableHeaderCell, styles.colIvaRate]}>IVA %</Text>
                        <Text style={[styles.tableHeaderCell, styles.colIvaAmount]}>IVA €</Text>
                        <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
                    </View>
                    {invoice.lines.length === 0 ? (
                        <View style={styles.tableRow}>
                            <Text style={[styles.tableCell, { color: '#94a3b8', fontStyle: 'italic' }]}>
                                Sin líneas de detalle
                            </Text>
                        </View>
                    ) : (
                        invoice.lines.map((line, idx) => {
                            const lineTotal = line.amount + (line.vatAmount || 0);
                            return (
                                <View key={idx} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, styles.colConcept]}>{line.concept}</Text>
                                    <Text style={[styles.tableCell, styles.colBase]}>{formatCurrency(line.amount)}</Text>
                                    <Text style={[styles.tableCell, styles.colIvaRate]}>{line.vatRate || 0}%</Text>
                                    <Text style={[styles.tableCell, styles.colIvaAmount]}>{formatCurrency(line.vatAmount || 0)}</Text>
                                    <Text style={[styles.tableCell, styles.colTotal]}>{formatCurrency(lineTotal)}</Text>
                                </View>
                            );
                        })
                    )}
                </View>

                {/* Totals */}
                <View style={styles.totalsSection}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Subtotal</Text>
                        <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>IVA</Text>
                        <Text style={styles.totalValue}>{formatCurrency(invoice.vatTotal)}</Text>
                    </View>
                    <View style={styles.grandTotalRow}>
                        <Text style={styles.grandTotalLabel}>TOTAL</Text>
                        <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
                    </View>
                </View>

                {/* Notes */}
                {invoice.notes && (
                    <View style={styles.notesSection}>
                        <Text style={styles.sectionLabel}>Observaciones</Text>
                        <Text style={styles.notesText}>{invoice.notes}</Text>
                    </View>
                )}

                {/* Footer */}
                <Text style={styles.footer}>
                    Documento generado por AGA Nexus
                </Text>
            </Page>
        </Document>
    );
};

export default InvoicePDFDocument;
