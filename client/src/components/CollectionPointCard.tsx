import React from 'react';
import { CollectionPoint } from '../types';
import { getFullImageUrl } from '../utils/imageUtils';

interface CollectionPointCardProps {
  point: CollectionPoint;
  onEdit?: (point: CollectionPoint) => void;
  onDelete?: (point: CollectionPoint) => void;
}

export const CollectionPointCard: React.FC<CollectionPointCardProps> = ({ point, onEdit, onDelete }) => {
  const imageUrl = getFullImageUrl(point.imageUrl);
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative h-48">
        <img
          src={imageUrl}
          alt={point.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error(`[CollectionPointCard] Erro ao carregar imagem para o ponto ${point.id}:`, e);
            e.currentTarget.src = '/assets/sem-imagem.svg';
          }}
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{point.name}</h3>
        <p className="text-gray-600 text-sm mb-2">{point.address}</p>
        {point.schedule && (
          <p className="text-gray-600 text-sm mb-2">
            <span className="font-medium">Horário:</span> {point.schedule}
          </p>
        )}
        {point.phone && (
          <p className="text-gray-600 text-sm mb-2">
            <span className="font-medium">Telefone:</span> {point.phone}
          </p>
        )}
        {point.whatsapp && (
          <p className="text-gray-600 text-sm mb-2">
            <span className="font-medium">WhatsApp:</span> {point.whatsapp}
          </p>
        )}
        {point.website && (
          <p className="text-gray-600 text-sm mb-2">
            <span className="font-medium">Website:</span>{' '}
            <a
              href={point.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {point.website}
            </a>
          </p>
        )}
        {point.description && (
          <p className="text-gray-600 text-sm mb-2">{point.description}</p>
        )}
        <div className="mt-4">
          <h4 className="font-medium mb-2">Materiais Aceitos:</h4>
          <div className="flex flex-wrap gap-2">
            {point.acceptedMaterials?.map((material) => (
              <span
                key={material.id}
                className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
              >
                {material.materialType}
              </span>
            ))}
          </div>
        </div>
        {(onEdit || onDelete) && (
          <div className="mt-4 flex justify-end gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(point)}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              >
                Editar
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(point)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Excluir
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 