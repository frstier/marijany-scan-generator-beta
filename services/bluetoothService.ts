
// --- Polyfill Types for Web Bluetooth ---
interface BluetoothRequestDeviceFilter {
  services?: (string | number)[];
  name?: string;
  namePrefix?: string;
  manufacturerData?: { [key: number]: { dataPrefix?: BufferSource; mask?: BufferSource } }[];
  serviceData?: { [key: string]: { dataPrefix?: BufferSource; mask?: BufferSource } }[];
}

interface RequestDeviceOptions {
  filters?: BluetoothRequestDeviceFilter[];
  optionalServices?: (string | number)[];
  acceptAllDevices?: boolean;
}

interface BluetoothRemoteGATTService {
  isPrimary: boolean;
  uuid: string;
  device: BluetoothDevice;
  getCharacteristic(characteristic: string | number): Promise<BluetoothRemoteGATTCharacteristic>;
  getCharacteristics(characteristic?: string | number): Promise<BluetoothRemoteGATTCharacteristic[]>;
  getIncludedService(service: string | number): Promise<BluetoothRemoteGATTService>;
  getIncludedServices(service?: string | number): Promise<BluetoothRemoteGATTService[]>;
}

interface BluetoothRemoteGATTCharacteristic {
  service: BluetoothRemoteGATTService;
  uuid: string;
  properties: BluetoothCharacteristicProperties;
  value?: DataView;
  getDescriptor(descriptor: string | number): Promise<BluetoothRemoteGATTDescriptor>;
  getDescriptors(descriptor?: string | number): Promise<BluetoothRemoteGATTDescriptor[]>;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithResponse(value: BufferSource): Promise<void>;
  writeValueWithoutResponse(value: BufferSource): Promise<void>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

interface BluetoothCharacteristicProperties {
  broadcast: boolean;
  read: boolean;
  writeWithoutResponse: boolean;
  write: boolean;
  notify: boolean;
  indicate: boolean;
  authenticatedSignedWrites: boolean;
  reliableWrite: boolean;
  writableAuxiliaries: boolean;
}

interface BluetoothRemoteGATTDescriptor {
  characteristic: BluetoothRemoteGATTCharacteristic;
  uuid: string;
  value?: DataView;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
}

interface BluetoothRemoteGATTServer {
  device: BluetoothDevice;
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string | number): Promise<BluetoothRemoteGATTService>;
  getPrimaryServices(service?: string | number): Promise<BluetoothRemoteGATTService[]>;
}

interface BluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
  watchAdvertisements(): Promise<void>;
  unwatchAdvertisements(): void;
  watchingAdvertisements: boolean;
}

declare global {
  interface Navigator {
    bluetooth: {
      getAvailability(): Promise<boolean>;
      requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>;
    };
  }
}
// ----------------------------------------

// Zebra Printer UUIDs
const ZEBRA_SERVICE_UUID = '38eb4a80-c570-11e3-9507-0002a5d5c51b';
const ZEBRA_WRITE_CHAR_UUID = '38eb4a82-c570-11e3-9507-0002a5d5c51b';

export class ZebraBluetoothClient {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;

  // Updated connect method to accept optional targetName
  async connect(targetName?: string): Promise<boolean> {
    try {
      if (!navigator.bluetooth) {
        throw new Error('Bluetooth API is not supported in this browser. Please use Chrome on Android/Desktop.');
      }

      console.log('Requesting Bluetooth Device...');
      
      const filters: BluetoothRequestDeviceFilter[] = [
        { namePrefix: 'Zebra' },
        { namePrefix: 'ZD' },
        { namePrefix: 'Printer' },
        { services: [ZEBRA_SERVICE_UUID] } // Try finding by service if name doesn't match
      ];

      // Add targetName to filters if provided
      if (targetName) {
        filters.unshift({ name: targetName });
      }

      // Expanded filters to catch more Zebra models
      this.device = await navigator.bluetooth.requestDevice({
        filters: filters,
        optionalServices: [ZEBRA_SERVICE_UUID, 'generic_access']
      });

      if (!this.device || !this.device.gatt) {
        throw new Error('Device selected but GATT not available');
      }

      console.log('Connecting to GATT Server...');
      const server = await this.device.gatt.connect();

      console.log('Getting Service...');
      // Try specific Zebra service
      const service = await server.getPrimaryService(ZEBRA_SERVICE_UUID);

      console.log('Getting Characteristic...');
      this.characteristic = await service.getCharacteristic(ZEBRA_WRITE_CHAR_UUID);
      
      console.log('Connected successfully!');
      return true;

    } catch (error) {
      console.error('Connection failed', error);
      this.disconnect(); // Cleanup on fail
      throw error;
    }
  }

  isConnected(): boolean {
    return !!(this.device && this.device.gatt && this.device.gatt.connected && this.characteristic);
  }

  getDeviceName(): string {
    return this.device?.name || 'Unknown Zebra';
  }

  async print(zpl: string): Promise<void> {
    if (!this.isConnected() || !this.characteristic) {
      throw new Error('Printer is not connected');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(zpl);
    
    // Chunk size: 512 bytes is usually safe for ZD620 BLE
    const CHUNK_SIZE = 512; 

    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      await this.characteristic.writeValue(chunk);
    }
  }

  disconnect() {
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
  }
}

export const zebraClient = new ZebraBluetoothClient();
