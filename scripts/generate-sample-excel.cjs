#!/usr/bin/env node

/**
 * Script para generar un archivo Excel de ejemplo con datos de prueba
 * 
 * Uso:
 *   npm run generate-sample-excel
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const sampleClients = [
    {
        identificador: '12345678A',
        nif: '12345678A',
        nombre: 'García López, Juan',
        domicilio: 'Calle Mayor 1, 28001 Madrid',
        cuentaContable: '43001',
        iban: 'ES1234567890123456789012'
    },
    {
        identificador: '87654321B',
        nif: '87654321B',
        nombre: 'Martínez Pérez, María',
        domicilio: 'Av. Constitución 45, 28002 Madrid',
        cuentaContable: '43002',
        iban: 'ES9876543210987654321098'
    },
    {
        identificador: 'B12345678',
        nif: 'B12345678',
        nombre: 'Construcciones AZ SL',
        domicilio: 'Polígono Industrial Las Merinas, 45003 Toledo',
        cuentaContable: '43003',
        iban: 'ES1122334455667788990011'
    },
    {
        identificador: 'A87654321',
        nif: 'A87654321',
        nombre: 'Transportes Rápidos SA',
        domicilio: 'Calle del Trabajo 12, 28010 Madrid',
        cuentaContable: '43004',
        iban: 'ES9988776655443322110000'
    },
    {
        identificador: '11223344C',
        nif: '11223344C',
        nombre: 'Rodríguez Sánchez, Carlos',
        domicilio: 'Plaza España 8, 28013 Madrid',
        cuentaContable: '43005',
        iban: 'ES5544332211009988776655'
    },
    // Cliente con datos mínimos (solo obligatorios)
    {
        identificador: '99887766D',
        nif: '',
        nombre: 'López Fernández, Ana',
        domicilio: '',
        cuentaContable: '',
        iban: ''
    },
    // Cliente empresa sin dirección ni IBAN
    {
        identificador: 'B99887766',
        nif: 'B99887766',
        nombre: 'Consultoría Tech SL',
        domicilio: '',
        cuentaContable: '43007',
        iban: ''
    },
];

function generateSampleExcel() {
    console.log('📝 Generando archivo Excel de ejemplo...\n');

    // Crear worksheet con los datos
    const worksheet = XLSX.utils.json_to_sheet(sampleClients);

    // Crear workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hoja1');

    // Ruta de salida
    const outputPath = path.join(process.cwd(), 'clientes-ejemplo.xlsx');

    // Escribir archivo
    XLSX.writeFile(workbook, outputPath);

    console.log('✅ Archivo generado exitosamente:');
    console.log(`   📁 ${outputPath}\n`);
    console.log('📋 Contenido del archivo:');
    console.log('   - 7 clientes de ejemplo');
    console.log('   - 4 particulares (DNI)');
    console.log('   - 3 empresas (CIF)');
    console.log('   - Incluye casos con datos completos y datos mínimos\n');
    console.log('🧪 Ahora puedes probar la importación con:');
    console.log(`   npm run import-clients ${outputPath}\n`);
}

generateSampleExcel();
