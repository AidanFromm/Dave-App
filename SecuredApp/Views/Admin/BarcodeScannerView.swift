//
//  BarcodeScannerView.swift
//  SecuredApp
//
//  Camera-based barcode scanner with manual entry option
//

import SwiftUI
import AVFoundation

struct BarcodeScannerView: View {
    @StateObject private var cameraScanner = BarcodeScannerService()
    @StateObject private var bluetoothScanner = BluetoothScannerService()
    @State private var showManualEntry = false
    @State private var manualBarcode = ""
    @State private var scanMode: ScanMode = .camera
    @State private var navigateToLookup = false
    @State private var scannedBarcode: String?

    @Environment(\.dismiss) private var dismiss

    enum ScanMode: String, CaseIterable {
        case camera = "Camera"
        case bluetooth = "Bluetooth"
        case manual = "Manual"
    }

    var body: some View {
        ZStack {
            // Camera Preview
            if scanMode == .camera {
                CameraPreviewView(scanner: cameraScanner)
                    .ignoresSafeArea()

                // Scanning overlay
                VStack {
                    Spacer()

                    // Scan frame
                    RoundedRectangle(cornerRadius: 12)
                        .strokeBorder(Color.green, lineWidth: 3)
                        .frame(width: 280, height: 150)
                        .overlay(
                            Text("Position barcode here")
                                .font(.caption)
                                .foregroundColor(.white)
                                .padding(4)
                                .background(Color.black.opacity(0.6))
                                .cornerRadius(4)
                                .offset(y: 90)
                        )

                    Spacer()
                }
            } else if scanMode == .bluetooth {
                bluetoothModeView
            } else {
                manualEntryView
            }

            // Top controls
            VStack {
                // Mode picker
                Picker("Scan Mode", selection: $scanMode) {
                    ForEach(ScanMode.allCases, id: \.self) { mode in
                        Text(mode.rawValue).tag(mode)
                    }
                }
                .pickerStyle(.segmented)
                .padding()
                .background(.ultraThinMaterial)

                Spacer()

                // Bottom controls
                VStack(spacing: 16) {
                    if let error = cameraScanner.error {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                            .padding(8)
                            .background(Color.white.opacity(0.9))
                            .cornerRadius(8)
                    }

                    if cameraScanner.isScanning && scanMode == .camera {
                        HStack {
                            ProgressView()
                            Text("Scanning...")
                                .font(.subheadline)
                        }
                        .padding(12)
                        .background(.ultraThinMaterial)
                        .cornerRadius(8)
                    }
                }
                .padding(.bottom, 40)
            }
        }
        .navigationTitle("Scan Barcode")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Cancel") {
                    dismiss()
                }
            }
        }
        .onAppear {
            if scanMode == .camera {
                cameraScanner.startScanning()
            }
        }
        .onDisappear {
            cameraScanner.stopScanning()
            bluetoothScanner.stopListening()
        }
        .onChange(of: scanMode) { _, newMode in
            handleModeChange(newMode)
        }
        .onChange(of: cameraScanner.scannedCode) { _, code in
            if let code = code {
                handleScannedCode(code)
            }
        }
        .onChange(of: bluetoothScanner.scannedCode) { _, code in
            if let code = code {
                handleScannedCode(code)
            }
        }
        .navigationDestination(isPresented: $navigateToLookup) {
            if let barcode = scannedBarcode {
                ProductLookupView(barcode: barcode)
            }
        }
    }

    // MARK: - Bluetooth Mode View

    private var bluetoothModeView: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "barcode.viewfinder")
                .font(.system(size: 80))
                .foregroundColor(.blue)

            Text("Bluetooth Scanner Mode")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Scan with your Bluetooth barcode scanner.\nThe app will automatically detect the scan.")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            if bluetoothScanner.isListening {
                HStack {
                    Circle()
                        .fill(Color.green)
                        .frame(width: 10, height: 10)
                    Text("Listening for scans...")
                        .foregroundColor(.green)
                }
                .padding()
                .background(Color.green.opacity(0.1))
                .cornerRadius(8)

                // Hidden text field to capture Bluetooth scanner input
                TextField("", text: $bluetoothScanner.inputBuffer)
                    .textFieldStyle(.plain)
                    .frame(width: 1, height: 1)
                    .opacity(0.01)
                    .focused($isBluetoothFieldFocused)
                    .onChange(of: bluetoothScanner.inputBuffer) { _, newValue in
                        bluetoothScanner.processInput(newValue)
                    }
            }

            Spacer()
        }
        .padding()
        .background(Color(.systemBackground))
    }

    @FocusState private var isBluetoothFieldFocused: Bool

    // MARK: - Manual Entry View

    private var manualEntryView: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "keyboard")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("Manual Barcode Entry")
                .font(.title2)
                .fontWeight(.semibold)

            TextField("Enter barcode number", text: $manualBarcode)
                .textFieldStyle(.roundedBorder)
                .keyboardType(.numberPad)
                .padding(.horizontal, 40)

            Button(action: {
                if !manualBarcode.isEmpty {
                    handleScannedCode(manualBarcode)
                }
            }) {
                Text("Look Up Product")
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(manualBarcode.isEmpty ? Color.gray : Color.green)
                    .foregroundColor(.white)
                    .cornerRadius(12)
            }
            .disabled(manualBarcode.isEmpty)
            .padding(.horizontal, 40)

            Spacer()
        }
        .padding()
        .background(Color(.systemBackground))
    }

    // MARK: - Helpers

    private func handleModeChange(_ newMode: ScanMode) {
        cameraScanner.stopScanning()
        bluetoothScanner.stopListening()

        switch newMode {
        case .camera:
            cameraScanner.startScanning()
        case .bluetooth:
            bluetoothScanner.startListening()
            isBluetoothFieldFocused = true
        case .manual:
            break
        }
    }

    private func handleScannedCode(_ code: String) {
        scannedBarcode = code
        navigateToLookup = true
    }
}

// MARK: - Camera Preview UIViewRepresentable

struct CameraPreviewView: UIViewRepresentable {
    let scanner: BarcodeScannerService

    func makeUIView(context: Context) -> UIView {
        let view = UIView(frame: .zero)
        view.backgroundColor = .black

        Task { @MainActor in
            if let previewLayer = scanner.setupScanner() {
                previewLayer.frame = view.bounds
                view.layer.addSublayer(previewLayer)
                scanner.startScanning()
            }
        }

        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        DispatchQueue.main.async {
            if let previewLayer = uiView.layer.sublayers?.first as? AVCaptureVideoPreviewLayer {
                previewLayer.frame = uiView.bounds
            }
        }
    }
}

#Preview {
    NavigationStack {
        BarcodeScannerView()
    }
}
