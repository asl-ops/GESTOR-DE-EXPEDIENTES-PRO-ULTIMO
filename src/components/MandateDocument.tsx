import React from 'react';
import { MandateData } from '@/types/mandate';

interface MandateDocumentProps {
    data: MandateData;
}

const MandateDocument: React.FC<MandateDocumentProps> = ({ data }) => {
    const formatDate = (date: Date) => {
        return {
            dia: date.getDate(),
            mes: date.toLocaleString('es-ES', { month: 'long' }),
            anio: date.getFullYear(),
        };
    };

    const { dia, mes, anio } = formatDate(data.firma.fecha);

    return (
        <div
            id="mandate-content"
            className="text-black"
            style={{
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: '11pt',
                lineHeight: 1.4,
                maxWidth: '210mm',
                margin: '0 auto',
                padding: '15mm',
                backgroundColor: '#ffffff',
                color: '#000000',
                textAlign: 'justify'
            }}
        >
            <div
                style={{
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '14pt',
                    marginBottom: '35px',
                    textTransform: 'uppercase',
                }}
            >
                MANDATO CON REPRESENTACIÓN
            </div>

            <div style={{ marginBottom: '20px', textAlign: 'justify' }}>
                D./ña.{' '}
                <span className="field" style={{ fontWeight: 'bold', color: '#00008B' }}>
                    {data.mandante.nombre}
                </span>{' '}
                con DNI{' '}
                <span className="field" style={{ fontWeight: 'bold', color: '#00008B' }}>
                    {data.mandante.dni}
                </span>
                {data.mandante.representante && (
                    <>
                        {' '}
                        y D./ña.{' '}
                        <span className="field" style={{ fontWeight: 'bold', color: '#00008B' }}>
                            {data.mandante.representante.nombre}
                        </span>{' '}
                        con DNI{' '}
                        <span className="field" style={{ fontWeight: 'bold', color: '#00008B' }}>
                            {data.mandante.representante.dni}
                        </span>
                    </>
                )}
                , que declara/declaran tener poder suficiente para actuar en su propio
                nombre y/o en representación de{' '}
                <span className="field" style={{ fontWeight: 'bold', color: '#00008B' }}>
                    {data.mandante.empresa || '__________________________'}
                </span>{' '}
                con DNI/CIF nº{' '}
                <span className="field" style={{ fontWeight: 'bold', color: '#00008B' }}>
                    {data.mandante.cif || '_________________'}
                </span>{' '}
                y domicilio a efectos de notificaciones en{' '}
                <span className="field" style={{ fontWeight: 'bold', color: '#00008B' }}>
                    {data.mandante.domicilio.poblacion}
                </span>
                , calle{' '}
                <span className="field" style={{ fontWeight: 'bold', color: '#00008B' }}>
                    {data.mandante.domicilio.calle}
                </span>{' '}
                nº{' '}
                <span className="field" style={{ fontWeight: 'bold', color: '#00008B' }}>
                    {data.mandante.domicilio.numero}
                </span>{' '}
                C.P.{' '}
                <span className="field" style={{ fontWeight: 'bold', color: '#00008B' }}>
                    {data.mandante.domicilio.cp}
                </span>
                , en concepto de <strong>MANDANTE</strong>, dice y otorga:
            </div>

            <div style={{ marginBottom: '20px', textAlign: 'justify' }}>
                Que por el presente documento confiere, con carácter específico,{' '}
                <strong>MANDATO CON REPRESENTACIÓN</strong> a favor de, el/los Gestor/es
                Administrativo/s en ejercicio, D./ña{' '}
                <span className="field" style={{ fontWeight: 'bold', color: '#00008B' }}>
                    {data.mandatario.nombre_1}
                </span>
                , con DNI{' '}
                <span className="field" style={{ fontWeight: 'bold', color: '#00008B' }}>
                    {data.mandatario.dni_1}
                </span>
                , número de colegiado{' '}
                <span className="field" style={{ fontWeight: 'bold', color: '#00008B' }}>
                    {data.mandatario.col_1}
                </span>
                {data.mandatario.nombre_2 && (
                    <>
                        , y D./ña{' '}
                        <span className="field" style={{ fontWeight: 'bold', color: '#00008B' }}>
                            {data.mandatario.nombre_2}
                        </span>
                        , con DNI{' '}
                        <span className="field" style={{ fontWeight: 'bold', color: '#00008B' }}>
                            {data.mandatario.dni_2}
                        </span>{' '}
                        número de colegiado{' '}
                        <span className="field" style={{ fontWeight: 'bold', color: '#00008B' }}>
                            {data.mandatario.col_2}
                        </span>
                    </>
                )}
                , todos ellos pertenecientes al Colegio Oficial de Gestores
                Administrativos de{' '}
                <span className="field" style={{ fontWeight: 'bold', color: '#00008B' }}>
                    {data.mandatario.colegio}
                </span>
                , y al despacho profesional{' '}
                <span className="field" style={{ fontWeight: 'bold', color: '#00008B' }}>
                    {data.mandatario.despacho}
                </span>
                , con domicilio en{' '}
                <span className="field" style={{ fontWeight: 'bold', color: '#00008B' }}>
                    {data.mandatario.domicilio.poblacion}
                </span>
                , calle{' '}
                <span className="field" style={{ fontWeight: 'bold', color: '#00008B' }}>
                    {data.mandatario.domicilio.calle}
                </span>{' '}
                nº{' '}
                <span className="field" style={{ fontWeight: 'bold', color: '#00008B' }}>
                    {data.mandatario.domicilio.numero}
                </span>{' '}
                C.P.{' '}
                <span className="field" style={{ fontWeight: 'bold', color: '#00008B' }}>
                    {data.mandatario.domicilio.cp}
                </span>
                , en concepto de <strong>MANDATARIO/S</strong>, para su actuación ante
                todos los órganos y entidades de la Administración del Estado,
                Autonómica, Provincial y Local que resulten competentes, y
                específicamente ante la Dirección General de Tráfico del Ministerio del
                Interior del Gobierno de España, para que promueva, solicite y realice
                todos los trámites necesarios en relación con el siguiente ASUNTO:
            </div>

            <div style={{ marginBottom: '20px', textAlign: 'justify' }}>
                <div style={{ marginLeft: '20px', marginBottom: '10px' }}>
                    •{' '}
                    <span
                        className="field"
                        style={{ fontWeight: 'bold', color: '#00008B', width: '90%' }}
                    >
                        {data.asunto.linea_1}
                    </span>
                </div>
                <div style={{ marginLeft: '20px', marginBottom: '10px' }}>
                    •{' '}
                    <span
                        className="field"
                        style={{ fontWeight: 'bold', color: '#00008B', width: '90%' }}
                    >
                        {data.asunto.linea_2 || '_____________________________________________________________________________________________________________________'}
                    </span>
                </div>
            </div>

            <div style={{ marginBottom: '20px', textAlign: 'justify' }}>
                El presente mandato, que se regirá por los artículos 1709 a 1739 del
                Código Civil, se confiere al amparo del artículo 5 de la Ley 39/2015, de
                1 de octubre, del Procedimiento Administrativo Común de las
                Administraciones Públicas, y del artículo 1 del Estatuto Orgánico de la
                Profesión de Gestor Administrativo, aprobado por Decreto 424/1963.
            </div>

            <div style={{ marginBottom: '20px', textAlign: 'justify' }}>
                El mandante autoriza al mandatario/s para que nombre/n sustituto/s, en
                caso de necesidad justificada, a favor de un/os Gestor/es
                Administrativo/s colegiado/s ejerciente/s. El presente mandato
                mantendrá su vigencia mientras no sea expresamente revocado por el
                mandante y comunicado fehacientemente su revocación al mandatario/s...
            </div>

            <div style={{ marginBottom: '20px', textAlign: 'justify' }}>
                En{' '}
                <span className="field" style={{ fontWeight: 'bold', color: '#00008B' }}>
                    {data.firma.lugar}
                </span>{' '}
                a{' '}
                <span className="field" style={{ fontWeight: 'bold', color: '#00008B' }}>
                    {dia}
                </span>{' '}
                de{' '}
                <span className="field" style={{ fontWeight: 'bold', color: '#00008B' }}>
                    {mes}
                </span>{' '}
                de{' '}
                <span className="field" style={{ fontWeight: 'bold', color: '#00008B' }}>
                    {anio}
                </span>
            </div>

            <div
                style={{
                    marginTop: '50px',
                    display: 'flex',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ width: '45%', textAlign: 'center' }}>
                    <strong>EL MANDANTE</strong>
                    <div
                        style={{
                            marginTop: '60px',
                            borderTop: '1px solid #000',
                            paddingTop: '10px',
                        }}
                    >
                    </div>
                </div>
                <div style={{ width: '45%', textAlign: 'center' }}>
                    <strong>EL MANDATARIO/S</strong>
                    <div
                        style={{
                            marginTop: '60px',
                            borderTop: '1px solid #000',
                            paddingTop: '10px',
                        }}
                    >
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MandateDocument;
