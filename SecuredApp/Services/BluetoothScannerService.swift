//
//  BluetoothScannerService.swift
//  SecuredApp
//
//  Bluetooth barcode scanner support
//  Works with HID-mode Bluetooth scanners that act as keyboards
//

import Foundation
import Combine

@MainActor
class BluetoothScannerService: ObservableObject {
    @Published var scannedCode: String?
    @Published var isListening = false
    @Published var inputBuffer: String = ""

    private var bufferResetTimer: Timer?

    // Most Bluetooth scanners in HID mode send characters followed by a return
    // We collect characters and process on return/newline

    func startListening() {
        isListening = true
        inputBuffer = ""
        scannedCode = nil
    }

    func stopListening() {
        isListening = false
        inputBuffer = ""
        bufferResetTimer?.invalidate()
    }

    /// Call this from a hidden TextField that captures keyboard input
    func processInput(_ text: String) {
        guard isListening else { return }

        // Reset timer on each keystroke
        bufferResetTimer?.invalidate()

        // Check for newline/return (scanner typically sends this at end)
        if text.contains("\n") || text.contains("\r") {
            let code = inputBuffer.trimmingCharacters(in: .whitespacesAndNewlines)
            if !code.isEmpty {
                scannedCode = code
            }
            inputBuffer = ""
        } else {
            inputBuffer = text

            // Auto-reset buffer after 100ms of no input (in case return wasn't sent)
            bufferResetTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: false) { [weak self] _ in
                Task { @MainActor [weak self] in
                    guard let self = self else { return }
                    let code = self.inputBuffer.trimmingCharacters(in: .whitespacesAndNewlines)
                    if code.count >= 8 { // Minimum barcode length
                        self.scannedCode = code
                    }
                    self.inputBuffer = ""
                }
            }
        }
    }

    func reset() {
        scannedCode = nil
        inputBuffer = ""
    }
}
