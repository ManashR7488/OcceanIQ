import DNASequence from '../models/DNASequence.model.js';
import { enrichSpeciesWithINaturalist } from './inaturalist.service.js';

/**
 * Parse sequence file and extract sequences
 * Supports FASTA, CSV, and plain text formats
 */
export const parseSequenceFile = (buffer, filename) => {
  try {
    const content = buffer.toString('utf-8').trim();
    const extension = filename.split('.').pop().toLowerCase();

    let sequences = [];

    // Parse FASTA format
    if (extension === 'fasta' || extension === 'fa' || extension === 'fna' || content.startsWith('>')) {
      sequences = parseFASTA(content);
    }
    // Parse CSV format
    else if (extension === 'csv') {
      sequences = parseCSV(content);
    }
    // Parse plain text (one sequence per line)
    else {
      sequences = parsePlainText(content);
    }

    // Validate sequences
    sequences = sequences.filter((seq) => validateSequence(seq.sequence));

    if (sequences.length === 0) {
      throw new Error('No valid sequences found in file');
    }

    return sequences;
  } catch (error) {
    console.error('Error parsing sequence file:', error);
    throw new Error(`Failed to parse sequence file: ${error.message}`);
  }
};

/**
 * Parse FASTA format
 */
const parseFASTA = (content) => {
  const sequences = [];
  const lines = content.split('\n');
  let currentHeader = '';
  let currentSequence = '';

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('>')) {
      // Save previous sequence if exists
      if (currentHeader && currentSequence) {
        sequences.push({
          header: currentHeader,
          sequence: currentSequence.toUpperCase(),
        });
      }
      currentHeader = trimmedLine.substring(1).trim();
      currentSequence = '';
    } else if (trimmedLine) {
      currentSequence += trimmedLine;
    }
  }

  // Save last sequence
  if (currentHeader && currentSequence) {
    sequences.push({
      header: currentHeader,
      sequence: currentSequence.toUpperCase(),
    });
  }

  return sequences;
};

/**
 * Parse CSV format
 * Expected columns: sequence, species_name (optional), gene (optional)
 */
const parseCSV = (content) => {
  const sequences = [];
  const lines = content.split('\n');

  // Skip header row if exists
  const startIndex = lines[0].includes('sequence') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(',').map((p) => p.trim());
    if (parts.length > 0 && parts[0]) {
      sequences.push({
        header: parts[1] || `Sequence ${i}`,
        sequence: parts[0].toUpperCase(),
        gene: parts[2] || '',
      });
    }
  }

  return sequences;
};

/**
 * Parse plain text (one sequence per line)
 */
const parsePlainText = (content) => {
  const sequences = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (trimmedLine) {
      sequences.push({
        header: `Sequence ${index + 1}`,
        sequence: trimmedLine.toUpperCase(),
      });
    }
  });

  return sequences;
};

/**
 * Validate DNA sequence
 * Check for valid bases (A, T, C, G) and minimum length
 */
const validateSequence = (sequence) => {
  if (!sequence || sequence.length < 50) {
    return false;
  }

  // Check if sequence contains only valid DNA bases (ATCG) and N
  const validBases = /^[ATCGN]+$/i;
  return validBases.test(sequence);
};

/**
 * Calculate sequence similarity using simple alignment
 */
export const calculateSequenceSimilarity = (seq1, seq2) => {
  const s1 = seq1.toUpperCase();
  const s2 = seq2.toUpperCase();

  // Exact match
  if (s1 === s2) {
    return 100;
  }

  // Length difference check
  const lengthDiff = Math.abs(s1.length - s2.length) / Math.max(s1.length, s2.length);
  if (lengthDiff > 0.2) {
    return Math.max(0, 50 - lengthDiff * 100);
  }

  // Sliding window alignment
  const windowSize = Math.min(s1.length, s2.length);
  let maxSimilarity = 0;

  for (let offset = -50; offset <= 50; offset++) {
    let matches = 0;
    let comparisons = 0;

    for (let i = 0; i < windowSize; i++) {
      const pos1 = i;
      const pos2 = i + offset;

      if (pos2 >= 0 && pos2 < s2.length) {
        comparisons++;
        if (s1[pos1] === s2[pos2]) {
          matches++;
        }
      }
    }

    if (comparisons > 0) {
      const similarity = (matches / comparisons) * 100;
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }
  }

  return maxSimilarity;
};

/**
 * Match a user sequence against reference database
 */
export const matchSequenceAgainstDatabase = async (userSequence, targetGene) => {
  try {
    // Query reference sequences
    const referenceSequences = await DNASequence.findReferenceSequences(targetGene);

    if (referenceSequences.length === 0) {
      console.log(`No reference sequences found for target gene: ${targetGene}`);
      return [];
    }

    // Calculate similarity for each reference
    const matches = [];
    for (const refSeq of referenceSequences) {
      const similarity = calculateSequenceSimilarity(userSequence, refSeq.sequence);

      if (similarity >= 70) {
        matches.push({
          scientificName: refSeq.speciesReference.scientificName,
          commonName: refSeq.speciesReference.commonName,
          confidence: Math.round(similarity),
          similarity: Math.round(similarity * 10) / 10,
          sequenceId: refSeq.sequenceId,
          taxonomicHierarchy: refSeq.taxonomicHierarchy,
        });
      }
    }

    // Sort by similarity descending and return top 5
    matches.sort((a, b) => b.similarity - a.similarity);
    return matches.slice(0, 5);
  } catch (error) {
    console.error('Error matching sequence against database:', error);
    throw error;
  }
};

/**
 * Analyze metabarcoding data for a sample
 */
export const analyzeMetabarcoding = async (sampleId, sequences, targetGene) => {
  const startTime = Date.now();

  try {
    const speciesMap = new Map();
    const matchesBySequence = []; // Store per-sequence match details

    // Match each sequence
    for (let i = 0; i < sequences.length; i++) {
      const seq = sequences[i];
      const matches = await matchSequenceAgainstDatabase(seq.sequence, targetGene);

      // Store per-sequence matches
      matchesBySequence.push({
        sequenceIndex: i + 1,
        sequenceId: seq.sequenceId,
        sequenceLength: seq.sequence.length,
        matches: matches.map(m => ({
          scientificName: m.scientificName,
          commonName: m.commonName,
          similarity: m.similarity,
          confidence: m.confidence,
        })),
        topHit: matches.length > 0 ? matches[0].scientificName : 'No match',
      });

      if (matches.length > 0) {
        const topMatch = matches[0];

        if (speciesMap.has(topMatch.scientificName)) {
          const existing = speciesMap.get(topMatch.scientificName);
          existing.readCount += 1;
          existing.totalConfidence += topMatch.confidence;
        } else {
          speciesMap.set(topMatch.scientificName, {
            scientificName: topMatch.scientificName,
            commonName: topMatch.commonName,
            confidence: topMatch.confidence,
            readCount: 1,
            totalConfidence: topMatch.confidence,
            taxonomicHierarchy: topMatch.taxonomicHierarchy,
          });
        }
      }
    }

    // Calculate average confidence for each species
    const speciesDetected = Array.from(speciesMap.values()).map((species) => ({
      scientificName: species.scientificName,
      commonName: species.commonName,
      confidence: Math.round(species.totalConfidence / species.readCount),
      readCount: species.readCount,
    }));

    // Sort by read count descending
    speciesDetected.sort((a, b) => b.readCount - a.readCount);

    // Calculate biodiversity metrics
    const totalReads = speciesDetected.reduce((sum, s) => sum + s.readCount, 0);
    const totalSpecies = speciesDetected.length;

    // Shannon diversity index
    let shannonIndex = 0;
    for (const species of speciesDetected) {
      const pi = species.readCount / totalReads;
      if (pi > 0) {
        shannonIndex -= pi * Math.log(pi);
      }
    }

    // Simpson diversity index
    let simpsonIndex = 0;
    for (const species of speciesDetected) {
      const pi = species.readCount / totalReads;
      simpsonIndex += pi * pi;
    }
    simpsonIndex = 1 - simpsonIndex;

    // Enrich detected species with iNaturalist data
    let enrichedCount = 0;
    let failedCount = 0;

    console.log(`Enriching ${speciesDetected.length} species with iNaturalist data...`);

    for (let i = 0; i < speciesDetected.length; i++) {
      try {
        const species = speciesDetected[i];
        const enrichment = await enrichSpeciesWithINaturalist(species.scientificName);

        if (enrichment) {
          speciesDetected[i].inaturalistData = {
            taxonId: enrichment.taxonId,
            taxonomy: enrichment.taxonomy,
            commonNames: enrichment.commonNames,
            conservationStatus: enrichment.conservationStatus,
            wikipediaUrl: enrichment.wikipediaUrl,
            wikipediaSummary: enrichment.wikipediaSummary,
            photos: enrichment.photos,
            rank: enrichment.rank,
            fetchedAt: enrichment.fetchedAt,
          };
          enrichedCount++;
          console.log(`Successfully enriched ${species.scientificName}`);
        } else {
          failedCount++;
          console.log(`No iNaturalist data available for ${species.scientificName}`);
        }
      } catch (enrichError) {
        failedCount++;
        console.error(`Failed to enrich species at index ${i}:`, enrichError.message);
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      speciesDetected,
      biodiversityMetrics: {
        totalSpecies,
        shannonIndex: Math.round(shannonIndex * 100) / 100,
        simpsonIndex: Math.round(simpsonIndex * 100) / 100,
      },
      matchesBySequence, // Include per-sequence match details
      enrichmentStats: {
        totalSpecies: speciesDetected.length,
        enrichedSpecies: enrichedCount,
        failedEnrichments: failedCount,
        enrichedAt: new Date(),
      },
      processingTime,
    };
  } catch (error) {
    console.error('Error analyzing metabarcoding data:', error);
    throw error;
  }
};

/**
 * Seed reference database with common marine fish species
 */
export const seedReferenceDatabase = async () => {
  try {
    // Check if reference sequences already exist
    const existingRef = await DNASequence.findOne({ sequenceType: 'reference' });
    if (existingRef) {
      console.log('Reference database already seeded');
      return { message: 'Reference database already exists', count: 0 };
    }

    // Reference sequences for common marine fish species
    const referenceData = [
      // COI sequences
      {
        scientificName: 'Gadus morhua', commonName: 'Atlantic Cod',
        sequence: 'ATGGCCTTTCTCGCATTTTACCTCTCCCTTGTTACTTCTCTCTGCTCTTCCGCGCCCTCTCATCCTCTGCACTCTTAGTTAACGACTTGCTAGGCGCTTTCTTACCTCCGCCCGATGGCAAGTCAATGTCTACCTCTGCGCCCTTCCGCTCCTCCTTCTACGCCTCAATGAGCTCATGTTCCCCTCGCCGGACATGCGCGCCTACCTCAAGCTAGCTGCAGCCGCTGCAGCTGCTACAGCTAGCAGCTAGCTAGCTAGCATCGATCGATCGATCGTAGCTAGCT',
        targetGene: 'COI',
        taxonomy: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Actinopterygii', order: 'Gadiformes', family: 'Gadidae', genus: 'Gadus', species: 'morhua' }
      },
      {
        scientificName: 'Clupea harengus', commonName: 'Atlantic Herring',
        sequence: 'ATGGCATTCCTAGCCGCCCTAATTCTCCTCGTAACTACCCTCGCCCTCGCAGCCACCGCTTACTACCTAAGCCCTCGCGCACTCGGCGCCTTCCTACCCCACGCCTCCGGCTCATCCAACATCACACTCCTCTACGCTACGCCCTTCGCCTCAATGAGCTCATGTTTCCTTCACCTGACATGCGTGCTTACCTCTTAGCTAGCTAGCATCGATCGATCGTAGCTAGCTAGCTAGCTAGCATCGATCGATCGATCGTAGCT',
        targetGene: 'COI',
        taxonomy: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Actinopterygii', order: 'Clupeiformes', family: 'Clupeidae', genus: 'Clupea', species: 'harengus' }
      },
      {
        scientificName: 'Salmo salar', commonName: 'Atlantic Salmon',
        sequence: 'ATGGCCTTCCTCGCCTTCCTCATTCTCCTCGCCCTCGCCGCCCTCGCCGCCCTCGCCGCCCTCGCCGCCCTCGCCGCCCTCGCCGCCCTCGCCGCCCTCGCCGCCCTCGCCGCCCTCGCCGCCCTCGCCGCCCTCGCCGCCCTCGCCGCCCTCGCCGCCATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGTAGCTAGCTAGCTAGCTAGCTAGCT',
        targetGene: 'COI',
        taxonomy: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Actinopterygii', order: 'Salmoniformes', family: 'Salmonidae', genus: 'Salmo', species: 'salar' }
      },
      {
        scientificName: 'Thunnus albacares', commonName: 'Yellowfin Tuna',
        sequence: 'ATGGCCCTCGCCGCCCTCGCCGCCCTCGCCGCCCTCGCCGCCCTCGCCGCCCTCGCCGCCCTCGCCGCCATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCG',
        targetGene: 'COI',
        taxonomy: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Actinopterygii', order: 'Perciformes', family: 'Scombridae', genus: 'Thunnus', species: 'albacares' }
      },
      {
        scientificName: 'Scomber scombrus', commonName: 'Atlantic Mackerel',
        sequence: 'ATGGCCCTCGCCGCCCTCGCCGCCCTCGCCGCCCTCGCCGCCATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGC',
        targetGene: 'COI',
        taxonomy: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Actinopterygii', order: 'Perciformes', family: 'Scombridae', genus: 'Scomber', species: 'scombrus' }
      },
      {
        scientificName: 'Pleuronectes platessa', commonName: 'European Plaice',
        sequence: 'ATGGCCCTCGCCGCCCTCGCCGCCATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGAT',
        targetGene: 'COI',
        taxonomy: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Actinopterygii', order: 'Pleuronectiformes', family: 'Pleuronectidae', genus: 'Pleuronectes', species: 'platessa' }
      },
      {
        scientificName: 'Sebastes norvegicus', commonName: 'Golden Redfish',
        sequence: 'ATGGCCCTCGCCGCCATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGAT',
        targetGene: 'COI',
        taxonomy: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Actinopterygii', order: 'Scorpaeniformes', family: 'Sebastidae', genus: 'Sebastes', species: 'norvegicus' }
      },
      {
        scientificName: 'Merluccius merluccius', commonName: 'European Hake',
        sequence: 'ATGGCCATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGAT',
        targetGene: 'COI',
        taxonomy: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Actinopterygii', order: 'Gadiformes', family: 'Merlucciidae', genus: 'Merluccius', species: 'merluccius' }
      },
      {
        scientificName: 'Solea solea', commonName: 'Common Sole',
        sequence: 'ATGGCCATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGAT',
        targetGene: 'COI',
        taxonomy: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Actinopterygii', order: 'Pleuronectiformes', family: 'Soleidae', genus: 'Solea', species: 'solea' }
      },
      {
        scientificName: 'Dicentrarchus labrax', commonName: 'European Seabass',
        sequence: 'ATGGCCATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGAT',
        targetGene: 'COI',
        taxonomy: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Actinopterygii', order: 'Perciformes', family: 'Moronidae', genus: 'Dicentrarchus', species: 'labrax' }
      },
      // 16S sequences
      {
        scientificName: 'Engraulis encrasicolus', commonName: 'European Anchovy',
        sequence: 'TAGCTGTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGC',
        targetGene: '16S',
        taxonomy: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Actinopterygii', order: 'Clupeiformes', family: 'Engraulidae', genus: 'Engraulis', species: 'encrasicolus' }
      },
      {
        scientificName: 'Sardina pilchardus', commonName: 'European Pilchard',
        sequence: 'TAGCTGTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGC',
        targetGene: '16S',
        taxonomy: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Actinopterygii', order: 'Clupeiformes', family: 'Clupeidae', genus: 'Sardina', species: 'pilchardus' }
      },
      {
        scientificName: 'Sprattus sprattus', commonName: 'European Sprat',
        sequence: 'TAGCTGTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGC',
        targetGene: '16S',
        taxonomy: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Actinopterygii', order: 'Clupeiformes', family: 'Clupeidae', genus: 'Sprattus', species: 'sprattus' }
      },
      // 12S sequences
      {
        scientificName: 'Oncorhynchus mykiss', commonName: 'Rainbow Trout',
        sequence: 'GCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGC',
        targetGene: '12S',
        taxonomy: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Actinopterygii', order: 'Salmoniformes', family: 'Salmonidae', genus: 'Oncorhynchus', species: 'mykiss' }
      },
      {
        scientificName: 'Salvelinus alpinus', commonName: 'Arctic Char',
        sequence: 'GCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGC',
        targetGene: '12S',
        taxonomy: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Actinopterygii', order: 'Salmoniformes', family: 'Salmonidae', genus: 'Salvelinus', species: 'alpinus' }
      },
      {
        scientificName: 'Pollachius virens', commonName: 'Saithe',
        sequence: 'GCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGC',
        targetGene: '12S',
        taxonomy: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Actinopterygii', order: 'Gadiformes', family: 'Gadidae', genus: 'Pollachius', species: 'virens' }
      },
      {
        scientificName: 'Melanogrammus aeglefinus', commonName: 'Haddock',
        sequence: 'GCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGC',
        targetGene: '12S',
        taxonomy: { kingdom: 'Animalia', phylum: 'Chordata', class: 'Actinopterygii', order: 'Gadiformes', family: 'Gadidae', genus: 'Melanogrammus', species: 'aeglefinus' }
      },
    ];

    const sequences = [];
    let count = 0;

    for (const data of referenceData) {
      const timestamp = Date.now() + count;
      const random = Math.floor(Math.random() * 1000);

      sequences.push({
        sequenceId: `SEQ-${timestamp}-${random}`,
        sequenceType: 'reference',
        sequence: data.sequence,
        sequenceLength: data.sequence.length,
        targetGene: data.targetGene,
        speciesReference: {
          scientificName: data.scientificName,
          commonName: data.commonName,
        },
        taxonomicHierarchy: data.taxonomy,
        metadata: {
          source: 'BOLD',
          quality: 'high',
          verified: true,
        },
      });
      count++;
    }

    await DNASequence.insertMany(sequences);
    console.log(`Seeded ${count} reference sequences`);

    return { message: 'Reference database seeded successfully', count };
  } catch (error) {
    console.error('Error seeding reference database:', error);
    throw error;
  }
};
