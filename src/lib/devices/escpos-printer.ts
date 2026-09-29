/**
 * ESC/POS Thermal Printer Driver for Restaurant KOT Tickets & Retail Receipts
 */
export interface PrintTicketPayload {
  header: string;
  subHeader?: string;
  items: Array<{ name: string; quantity: number; price?: number }>;
  footer?: string;
}

export class EscPosPrinter {
  /**
   * Generates ESC/POS byte buffer commands for thermal ticket printing
   */
  static generateKotBytes(ticket: PrintTicketPayload): Uint8Array {
    const encoder = new TextEncoder();
    const commands: number[] = [];

    // ESC @ (Initialize printer)
    commands.push(0x1B, 0x40);

    // ESC a 1 (Center Align)
    commands.push(0x1B, 0x61, 0x01);

    // Header (Double height/width)
    commands.push(0x1D, 0x21, 0x11);
    commands.push(...Array.from(encoder.encode(`${ticket.header}\n`)));

    if (ticket.subHeader) {
      commands.push(0x1D, 0x21, 0x00);
      commands.push(...Array.from(encoder.encode(`${ticket.subHeader}\n`)));
    }

    // ESC a 0 (Left Align)
    commands.push(0x1B, 0x61, 0x00);
    commands.push(...Array.from(encoder.encode('--------------------------------\n')));

    // Items
    commands.push(0x1D, 0x21, 0x00);
    ticket.items.forEach(item => {
      const line = `${item.quantity}x ${item.name}\n`;
      commands.push(...Array.from(encoder.encode(line)));
    });

    commands.push(...Array.from(encoder.encode('--------------------------------\n')));

    if (ticket.footer) {
      commands.push(...Array.from(encoder.encode(`${ticket.footer}\n`)));
    }

    // Feed 3 lines & Paper Cut (GS V 66 0)
    commands.push(0x1B, 0x64, 0x03);
    commands.push(0x1D, 0x56, 0x42, 0x00);

    return new Uint8Array(commands);
  }
}
