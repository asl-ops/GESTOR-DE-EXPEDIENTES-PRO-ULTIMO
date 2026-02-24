
import { CaseRecord, AgencyData } from '../types';

const PROVINCE_TO_JEFATURA: Record<string, string> = {
  'ALMERIA': 'AL',
  'ALMERÍA': 'AL',
  'MADRID': 'M',
  'BARCELONA': 'B',
  'MALAGA': 'MA',
  'MÁLAGA': 'MA',
  'SEVILLA': 'SE',
  'GRANADA': 'GR',
  'VALENCIA': 'V',
  'MURCIA': 'MU'
};

const formatDateToXml = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  // Try to extract YYYY, MM, DD
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    // Maybe it's already in a different format, try digits only
    const digits = dateStr.replace(/\D/g, '');
    if (digits.length === 8) return digits;
    return '';
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
};

const splitFullAddress = (address: string) => {
  if (!address) return { type: 'CALLE', name: '', number: '' };

  const parts = address.split(',');
  const namePart = parts[0].trim();
  const numberPart = parts[1]?.trim() || '';

  // Try to detect street type
  let type = 'CALLE';
  let name = namePart;

  const typeMatch = namePart.match(/^(CALLE|AVENIDA|AVDA|PLAZA|BOULEVARD|CTRA|CARRETERA|PASEO|PS)\.?\s+(.+)/i);
  if (typeMatch) {
    const detectedType = typeMatch[1].toUpperCase();
    if (detectedType.startsWith('AV')) type = 'AVENIDA';
    else if (detectedType === 'PS') type = 'PASEO';
    else if (detectedType.startsWith('CTRA')) type = 'CARRETERA';
    else type = detectedType;
    name = typeMatch[2];
  }

  return { type, name, number: numberPart.replace(/\D/g, '') };
};

export const generateHermesSolicitudesXml = (caseRecord: CaseRecord, agency?: AgencyData): string => {
  const { client, vehicle } = caseRecord;

  const splitSurnames = (surnames: string): { first: string; second: string } => {
    if (!surnames) return { first: '', second: '' };
    const parts = surnames.trim().split(/\s+/);
    return {
      first: parts.shift() || '',
      second: parts.join(' ')
    };
  };

  const { first: firstSurname, second: secondSurname } = splitSurnames(client.surnames || '');
  const jefatura = PROVINCE_TO_JEFATURA[(client.province || '').toUpperCase()] || 'M';
  const addressInfo = splitFullAddress(client.address || '');

  // Clean values for XML
  const clean = (val: any) => String(val || '').toUpperCase().trim();

  return `<?xml version="1.0" encoding="UTF-8"?>
<Lista_Solicitudes>
	<Solicitud>
		<Id_Gestor>${agency?.managerColegiado || '421'}</Id_Gestor>
		<Jefatura>${jefatura}</Jefatura>
		<Sucursal/>
		<Datos_Vehiculo>
			<Servicio>${clean(vehicle.serviceCode || 'B00')}</Servicio>
			<Fecha_Primera_Matriculacion>${formatDateToXml(vehicle.year)}</Fecha_Primera_Matriculacion>
			<Bastidor>${clean(vehicle.vin)}</Bastidor>
			<Codigo_ITV>${clean(vehicle.itvCode || 'BA02')}</Codigo_ITV>
			<Kilometraje>${clean((vehicle as any).mileage || '0')}</Kilometraje>
			<Cuenta_Horas>0</Cuenta_Horas>
			<Fecha_Validez_ITV>${formatDateToXml(vehicle.itvExpiration)}</Fecha_Validez_ITV>
			<Importado>${vehicle.isImported ? 'S' : 'N'}</Importado>
			<Subasta>N</Subasta>
			<Usado>${vehicle.isUsed ? 'S' : 'N'}</Usado>
			<Tipo_Inspeccion_Itv>M</Tipo_Inspeccion_Itv>
			<Carsharing>N</Carsharing>
			<Renting>N</Renting>
		</Datos_Vehiculo>
		<Titular>
			<Identificacion>
				<Datos_Nombre>
					<Nombre>${clean(client.firstName)}</Nombre>
					<Primer_Apellido>${clean(firstSurname)}</Primer_Apellido>
					<Segundo_Apellido>${clean(secondSurname)}</Segundo_Apellido>
				</Datos_Nombre>
				<Documento_Identidad>
					<Numero>${clean(client.nif)}</Numero>
				</Documento_Identidad>
				<Fecha_Nacimiento>${formatDateToXml(client.birthDate)}</Fecha_Nacimiento>
				<Sexo>${client.gender || 'V'}</Sexo>
			</Identificacion>
			<Servicio_Autonomo>
				<Autonomo>${client.isSelfEmployed ? 'S' : 'N'}</Autonomo>
				<Codigo_IAE>${client.iaeCode || ''}</Codigo_IAE>
			</Servicio_Autonomo>
			<Domicilio_Titular>
				<Municipio>${clean((client as any).municipalityCode || '')}</Municipio>
				<Localidad>${clean(client.city)}</Localidad>
				<Provincia>${jefatura}</Provincia>
				<Codigo_Postal>${clean(client.postalCode)}</Codigo_Postal>
				<Tipo_Via>${addressInfo.type}</Tipo_Via>
				<Nombre_Via>${clean(addressInfo.name)}</Nombre_Via>
				<Numero>${addressInfo.number}</Numero>
				<Portal/>
				<Planta/>
				<Puerta/>
			</Domicilio_Titular>
		</Titular>
		<Domicilio_Vehiculo>
			<Municipio>${clean((client as any).municipalityCode || '')}</Municipio>
			<Localidad>${clean(client.city)}</Localidad>
			<Provincia>${jefatura}</Provincia>
			<Codigo_Postal>${clean(client.postalCode)}</Codigo_Postal>
			<Tipo_Via>${addressInfo.type}</Tipo_Via>
			<Nombre_Via>${clean(addressInfo.name)}</Nombre_Via>
			<Numero>${addressInfo.number}</Numero>
			<Portal/>
			<Planta/>
			<Puerta/>
		</Domicilio_Vehiculo>
		<Caracteristicas_Tecnicas>
			<Tipo>${clean(vehicle.type || '20')}</Tipo>
			<Clase>${clean(vehicle.classCode || '2011')}</Clase>
			<Marca>${clean(vehicle.brand)}</Marca>
			<Fabricante>${clean(vehicle.manufacturer || vehicle.brand)}</Fabricante>
			<Modelo_Nombre>${clean(vehicle.model)}</Modelo_Nombre>
			<Carroceria>${clean(vehicle.bodywork || 'BA')}</Carroceria>
			<Variante_Version>${clean(vehicle.variantVersion || '')}</Variante_Version>
			<Nivel_Emisiones>${clean(vehicle.emissions || 'EURO 6E')}</Nivel_Emisiones>
			<Categoria_Homologacion_Europea>${clean(vehicle.euroCategory || 'N1')}</Categoria_Homologacion_Europea>
			<Pais_Fabricacion>380</Pais_Fabricacion>
			<Numero_Homologacion>${clean(vehicle.homologationNumber || '')}</Numero_Homologacion>
			<Fecha_Homologacion>${formatDateToXml(vehicle.homologationDate)}</Fecha_Homologacion>
			<Tipo_Tarjeta_ITV>D</Tipo_Tarjeta_ITV>
			<Numero_Serie_ITV>${clean(vehicle.itvSerialNumber || '')}</Numero_Serie_ITV>
			<Plazas>${clean((vehicle as any).seats || '5')}</Plazas>
			<Potencia_Fiscal>${clean(vehicle.power || '')}</Potencia_Fiscal>
			<Cilindrada>${clean(vehicle.engineSize)}</Cilindrada>
			<Potencia_Neta_Maxima>${clean(vehicle.maxNetPower || '')}</Potencia_Neta_Maxima>
			<Masa_Orden_Marcha>${clean(vehicle.massInOrder || '')}</Masa_Orden_Marcha>
			<Masa_Maxima_Autorizada>${clean(vehicle.mma || '')}</Masa_Maxima_Autorizada>
			<Masa_Maxima_Tecnica_Admisible>${clean(vehicle.technicalMma || vehicle.mma || '')}</Masa_Maxima_Tecnica_Admisible>
			<Tara>${clean(vehicle.tara || '')}</Tara>
			<Distancia_Ejes>${clean(vehicle.wheelbase || '')}</Distancia_Ejes>
			<Numero_Ejes>${clean(vehicle.axles || '2')}</Numero_Ejes>
			<Carburante>${clean(vehicle.fuelType === 'DIESEL' ? 'D' : vehicle.fuelType === 'GASOLINA' ? 'G' : 'D')}</Carburante>
			<Alimentacion>M</Alimentacion>
			<Longitud>${clean(vehicle.length || '')}</Longitud>
			<Anchura>${clean(vehicle.width || '')}</Anchura>
			<Altura>${clean(vehicle.height || '')}</Altura>
			<Via_Anterior>${clean(vehicle.anteriorVia || '')}</Via_Anterior>
			<Via_Posterior>${clean(vehicle.posteriorVia || '')}</Via_Posterior>
		</Caracteristicas_Tecnicas>
		<Tipo_Tramite>A-01</Tipo_Tramite>
		<Medio_Pago>T</Medio_Pago>
	</Solicitud>
</Lista_Solicitudes>`;
};


// Based on Hermes import specifications
const HERMES_HEADERS = [
  // Titular
  "NIF", "Nombre", "Primer Apellido", "Segundo Apellido", "Razón Social",
  "Domicilio", "Municipio", "Provincia", "Código Postal",
  // Vehículo - Identificación
  "Bastidor", "Marca (D.1)", "Modelo", "Tipo", "Variante", "Versión", "Fabricante (A.1)",
  // Vehículo - Clasificación
  "Servicio", "Carrocería (J.1)", "Categoría EU (J)", "Código ITV",
  // Vehículo - Importación
  "Importado", "País de primera matriculación", "Subasta",
  // Vehículo - Datos Técnicos
  "Cilindrada (P.1)", "Potencia (kW) (P.2)", "Tipo de combustible (P.3)",
  "Emisiones de CO2 (V.7)", "Nivel de emisiones Euro (V.9)", "MMA O MTMA (F.1)",
  "Masa en orden de marcha (F.2)", "Número de plazas (S.1)",
  "Número de ejes", "Distancia entre ejes (M.1)",
  "Vía anterior (F.7)", "Vía posterior (F.7.1)",
  "Consumo eléctrico Wh/km", "Fecha de caducidad de ITV",
];

const escapeCsvField = (field: any): string => {
  const str = String(field ?? '');
  if (/[";,\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const splitSurnamesForCsv = (surnames: string): { first: string; second: string } => {
  if (!surnames) return { first: '', second: '' };
  const parts = surnames.trim().split(/\s+/);
  return {
    first: parts.shift() || '',
    second: parts.join(' ')
  };
};

export const generateHermesFileContent = (cases: CaseRecord[]): string => {
  const rows = cases.map(caseRecord => {
    const { client, vehicle } = caseRecord;
    const { first: firstSurname, second: secondSurname } = splitSurnamesForCsv(client.surnames || '');

    const dataRow = {
      "NIF": client.nif,
      "Nombre": client.firstName,
      "Primer Apellido": firstSurname,
      "Segundo Apellido": secondSurname,
      "Razón Social": client.firstName ? '' : client.surnames,
      "Domicilio": client.address,
      "Municipio": client.city,
      "Provincia": client.province,
      "Código Postal": client.postalCode,
      "Bastidor": vehicle.vin,
      "Marca (D.1)": vehicle.brand,
      "Modelo": vehicle.model,
      "Tipo": '', "Variante": '', "Versión": '', "Fabricante (A.1)": '',
      "Servicio": '', "Carrocería (J.1)": '', "Categoría EU (J)": '', "Código ITV": '',
      "Importado": '', "País de primera matriculación": '', "Subasta": '',
      "Cilindrada (P.1)": vehicle.engineSize,
      "Potencia (kW) (P.2)": '',
      "Tipo de combustible (P.3)": vehicle.fuelType,
      "Emisiones de CO2 (V.7)": '', "Nivel de emisiones Euro (V.9)": '',
      "MMA O MTMA (F.1)": '', "Masa en orden de marcha (F.2)": '', "Número de plazas (S.1)": '',
      "Número de ejes": '', "Distancia entre ejes (M.1)": '',
      "Vía anterior (F.7)": '', "Vía posterior (F.7.1)": '',
      "Consumo eléctrico Wh/km": '', "Fecha de caducidad de ITV": '',
    };

    return HERMES_HEADERS.map(header => dataRow[header as keyof typeof dataRow]);
  });

  const csvContent = [
    HERMES_HEADERS.join(';'),
    ...rows.map(row => row.map(escapeCsvField).join(';'))
  ].join('\n');

  return '\uFEFF' + csvContent; // Add BOM for Excel UTF-8 compatibility
};