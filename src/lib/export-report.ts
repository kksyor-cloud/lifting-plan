import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/** 검토서를 PDF로 만든다. 웹은 인쇄 창(PDF로 저장), 앱은 PDF 파일을 만들어 공유 창을 연다. */
export async function exportReport(html: string, fileTitle: string): Promise<void> {
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: fileTitle });
  } else {
    await Print.printAsync({ uri });
  }
}
