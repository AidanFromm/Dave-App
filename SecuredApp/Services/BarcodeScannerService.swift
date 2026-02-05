//
//  BarcodeScannerService.swift
//  SecuredApp
//
//  Barcode scanning using iPhone camera (AVFoundation)
//  Supports UPC, EAN-13, and other common barcode formats
//

import AVFoundation
import UIKit
import AudioToolbox
import Combine

@MainActor
class BarcodeScannerService: NSObject, ObservableObject {
    @Published var scannedCode: String?
    @Published var isScanning = false
    @Published var error: String?
    @Published var permissionGranted = false

    private var captureSession: AVCaptureSession?
    private var previewLayer: AVCaptureVideoPreviewLayer?

    override init() {
        super.init()
        checkPermission()
    }

    // MARK: - Permission

    func checkPermission() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            permissionGranted = true
        case .notDetermined:
            requestPermission()
        case .denied, .restricted:
            permissionGranted = false
            error = "Camera access denied. Please enable in Settings."
        @unknown default:
            permissionGranted = false
        }
    }

    private func requestPermission() {
        AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
            Task { @MainActor in
                self?.permissionGranted = granted
                if !granted {
                    self?.error = "Camera access is required to scan barcodes"
                }
            }
        }
    }

    // MARK: - Scanner Setup

    func setupScanner() -> AVCaptureVideoPreviewLayer? {
        guard permissionGranted else {
            error = "Camera permission not granted"
            return nil
        }

        let session = AVCaptureSession()

        guard let videoCaptureDevice = AVCaptureDevice.default(for: .video) else {
            error = "No camera available"
            return nil
        }

        do {
            let videoInput = try AVCaptureDeviceInput(device: videoCaptureDevice)

            if session.canAddInput(videoInput) {
                session.addInput(videoInput)
            } else {
                error = "Could not add video input"
                return nil
            }

            let metadataOutput = AVCaptureMetadataOutput()

            if session.canAddOutput(metadataOutput) {
                session.addOutput(metadataOutput)

                metadataOutput.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
                metadataOutput.metadataObjectTypes = [
                    .ean8,
                    .ean13,
                    .upce,
                    .code128,
                    .code39,
                    .code93,
                    .qr
                ]
            } else {
                error = "Could not add metadata output"
                return nil
            }

        } catch {
            self.error = error.localizedDescription
            return nil
        }

        captureSession = session

        let previewLayer = AVCaptureVideoPreviewLayer(session: session)
        previewLayer.videoGravity = .resizeAspectFill
        self.previewLayer = previewLayer

        return previewLayer
    }

    // MARK: - Control

    func startScanning() {
        scannedCode = nil
        error = nil

        if captureSession == nil {
            _ = setupScanner()
        }

        guard let session = captureSession else { return }

        if !session.isRunning {
            DispatchQueue.global(qos: .userInitiated).async {
                session.startRunning()
            }
        }
        isScanning = true
    }

    func stopScanning() {
        guard let session = captureSession else {
            isScanning = false
            return
        }

        if session.isRunning {
            DispatchQueue.global(qos: .userInitiated).async {
                session.stopRunning()
            }
        }
        isScanning = false
    }

    func resetScanner() {
        scannedCode = nil
        error = nil
    }

    // MARK: - Manual Entry

    func processManualBarcode(_ code: String) {
        let trimmed = code.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            error = "Please enter a valid barcode"
            return
        }
        scannedCode = trimmed
    }
}

// MARK: - AVCaptureMetadataOutputObjectsDelegate

extension BarcodeScannerService: AVCaptureMetadataOutputObjectsDelegate {
    nonisolated func metadataOutput(
        _ output: AVCaptureMetadataOutput,
        didOutput metadataObjects: [AVMetadataObject],
        from connection: AVCaptureConnection
    ) {
        guard let metadataObject = metadataObjects.first,
              let readableObject = metadataObject as? AVMetadataMachineReadableCodeObject,
              let stringValue = readableObject.stringValue else {
            return
        }

        // Vibrate to indicate successful scan
        AudioServicesPlaySystemSound(SystemSoundID(kSystemSoundID_Vibrate))

        Task { @MainActor [weak self] in
            self?.scannedCode = stringValue
            self?.stopScanning()
        }
    }
}
