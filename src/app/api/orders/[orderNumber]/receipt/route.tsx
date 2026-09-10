import { notFound } from "next/navigation";
import { renderToBuffer } from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { paiseToRupeeDisplay, paiseToWords } from "@/lib/money";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 4 },
  muted: { color: "#666666", marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: "#eeeeee" },
  total: { flexDirection: "row", justifyContent: "space-between", paddingTop: 8, fontSize: 13 },
});

export async function GET(request: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true, customer: true, address: true },
  });
  if (!order) notFound();

  const settings = await prisma.siteSettings.findFirst();

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{settings?.businessName ?? "XOXO Patisserie"}</Text>
        <Text style={styles.muted}>
          GSTIN: {settings?.gstNumber} · FSSAI: {settings?.fssaiNumber}
        </Text>
        <Text>Invoice for Order {order.orderNumber}</Text>
        <Text style={styles.muted}>{order.customer.name} · {order.customer.phone}</Text>

        {order.items.map((item) => (
          <View key={item.id} style={styles.row}>
            <Text>{item.nameSnapshot} × {item.quantity}</Text>
            <Text>{paiseToRupeeDisplay(item.lineTotalPaise)}</Text>
          </View>
        ))}
        <View style={styles.row}>
          <Text>GST</Text>
          <Text>{paiseToRupeeDisplay(order.gstPaise)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Packaging</Text>
          <Text>{paiseToRupeeDisplay(order.packagingPaise)}</Text>
        </View>
        <View style={styles.total}>
          <Text>Total</Text>
          <Text>{paiseToRupeeDisplay(order.totalPaise)}</Text>
        </View>
        <Text style={{ marginTop: 8 }}>{paiseToWords(order.totalPaise)}</Text>
      </Page>
    </Document>
  );

  const buffer = await renderToBuffer(doc);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=${order.orderNumber}.pdf`,
    },
  });
}
