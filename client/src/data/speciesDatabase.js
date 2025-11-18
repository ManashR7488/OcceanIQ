/**
 * Static Species Database for Marine Fish Identification
 * 
 * This database contains comprehensive information about common marine fish species
 * including taxonomy, morphology, ecology, habitat, and distribution data.
 * 
 * Data sourced from Wikipedia, FishBase, and WoRMS for accuracy.
 */

/**
 * @typedef {Object} Species
 * @property {string} scientificName - Binomial nomenclature (Genus species)
 * @property {string[]} commonNames - Array of common names
 * @property {Object} taxonomicHierarchy - Complete taxonomic classification
 * @property {string} description - Detailed species description
 * @property {string} habitat - Natural habitat information
 * @property {string} distribution - Geographic distribution
 * @property {Object} morphology - Physical characteristics
 * @property {Object} ecology - Ecological information
 * @property {string} conservationStatus - IUCN status
 * @property {string} economicImportance - Economic/commercial importance
 * @property {string} imageUrl - Full resolution image URL
 * @property {string} thumbnailUrl - Thumbnail image URL
 * @property {Object} externalLinks - Links to external resources
 */

export const SPECIES_DATABASE = [
  {
    scientificName: "Gadus morhua",
    commonNames: ["Atlantic Cod", "Cod", "Codling"],
    taxonomicHierarchy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Actinopterygii",
      order: "Gadiformes",
      family: "Gadidae",
      genus: "Gadus",
      species: "Gadus morhua"
    },
    description: "The Atlantic cod is a benthopelagic fish of the family Gadidae, widely consumed by humans. It can grow up to 2 meters in length and weigh up to 96 kg. Atlantic cod are demersal fish living near the seabed in depths between 150-200m. They have a distinctive barbel on their chin and three dorsal fins.",
    habitat: "Cold waters of the North Atlantic, preferring temperatures between 0-20°C. Found near the seabed on continental shelves and slopes.",
    distribution: "North Atlantic Ocean, from Cape Hatteras to Greenland, Iceland, and the Barents Sea. Common in waters around North America and Europe.",
    morphology: {
      maxLength: 200,
      maxWeight: 96,
      distinctiveFeatures: [
        "Single barbel on chin",
        "Three dorsal fins and two anal fins",
        "Greenish-brown coloration with spots",
        "Pale lateral line running along body"
      ]
    },
    ecology: {
      diet: "Carnivorous, feeding on smaller fish, crustaceans, mollusks, and worms. Adults prey on herring, capelin, and sand eels.",
      behavior: "Benthopelagic, forming large schools. Undertakes seasonal migrations for feeding and spawning.",
      depthRange: {
        min: 0,
        max: 600
      }
    },
    conservationStatus: "Vulnerable",
    economicImportance: "Highly important commercial species. Major fishery since Viking times. Used for fresh fish, salted (bacalao), dried, and fish oil production.",
    imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
    thumbnailUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200",
    externalLinks: {
      wikipedia: "https://en.wikipedia.org/wiki/Atlantic_cod",
      fishbase: "https://www.fishbase.se/summary/69"
    }
  },
  {
    scientificName: "Salmo salar",
    commonNames: ["Atlantic Salmon", "Salmon", "Bay Salmon"],
    taxonomicHierarchy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Actinopterygii",
      order: "Salmoniformes",
      family: "Salmonidae",
      genus: "Salmo",
      species: "Salmo salar"
    },
    description: "Atlantic salmon is an anadromous fish, born in freshwater and migrating to the ocean before returning to freshwater to reproduce. They are highly prized for their pink flesh and are extensively farmed. Adults can reach up to 1.5 meters in length and weigh over 45 kg.",
    habitat: "Anadromous species living in both freshwater (rivers, streams) and marine environments. Requires cold, oxygen-rich water.",
    distribution: "Native to North Atlantic Ocean, rivers of North America from Connecticut northward, and European rivers from Portugal to Russia. Introduced to other regions.",
    morphology: {
      maxLength: 150,
      maxWeight: 46,
      distinctiveFeatures: [
        "Silvery body with black spots above lateral line",
        "Forked tail fin",
        "Pink to orange flesh",
        "Streamlined torpedo-shaped body"
      ]
    },
    ecology: {
      diet: "Carnivorous. In freshwater: insects, amphipods, small fish. In ocean: fish, squid, shrimp, and krill.",
      behavior: "Anadromous migration, returning to natal streams to spawn. Juveniles spend 1-6 years in freshwater before migrating to sea.",
      depthRange: {
        min: 0,
        max: 210
      }
    },
    conservationStatus: "Least Concern",
    economicImportance: "Extremely important for commercial aquaculture and wild fisheries. Valued sport fish. Major aquaculture species worldwide with production exceeding 2 million tonnes annually.",
    imageUrl: "https://images.unsplash.com/photo-1534043464124-3be32fe000c9?w=800",
    thumbnailUrl: "https://images.unsplash.com/photo-1534043464124-3be32fe000c9?w=200",
    externalLinks: {
      wikipedia: "https://en.wikipedia.org/wiki/Atlantic_salmon",
      fishbase: "https://www.fishbase.se/summary/236"
    }
  },
  {
    scientificName: "Thunnus thynnus",
    commonNames: ["Atlantic Bluefin Tuna", "Bluefin Tuna", "Northern Bluefin Tuna"],
    taxonomicHierarchy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Actinopterygii",
      order: "Perciformes",
      family: "Scombridae",
      genus: "Thunnus",
      species: "Thunnus thynnus"
    },
    description: "The Atlantic bluefin tuna is one of the largest and fastest fish in the world, capable of reaching speeds up to 70 km/h. They are highly migratory pelagic fish with a distinctive blue-black dorsal coloration. Bluefin tuna are warm-blooded, allowing them to thrive in cold waters.",
    habitat: "Pelagic species inhabiting open ocean waters. Prefers temperatures between 3-30°C. Found from surface to depths of 1000m.",
    distribution: "Western and eastern Atlantic Ocean, Mediterranean Sea. Migrates across the Atlantic between spawning grounds in Gulf of Mexico and feeding grounds off Canada and Europe.",
    morphology: {
      maxLength: 458,
      maxWeight: 684,
      distinctiveFeatures: [
        "Metallic blue dorsal surface",
        "Silver-white ventral side",
        "Short pectoral fins",
        "Two dorsal fins, first retractable"
      ]
    },
    ecology: {
      diet: "Carnivorous, feeding on fish (herring, mackerel, eels), squid, and crustaceans. Opportunistic predators hunting in schools.",
      behavior: "Highly migratory, traveling thousands of kilometers. Forms schools by size. Capable of endothermy (warm-blooded).",
      depthRange: {
        min: 0,
        max: 1000
      }
    },
    conservationStatus: "Endangered",
    economicImportance: "Extremely valuable commercial species, particularly for sushi and sashimi markets. Individual fish can sell for over $3 million. Heavily overfished leading to population declines.",
    imageUrl: "https://images.unsplash.com/photo-1560155477-f2b52962fd62?w=800",
    thumbnailUrl: "https://images.unsplash.com/photo-1560155477-f2b52962fd62?w=200",
    externalLinks: {
      wikipedia: "https://en.wikipedia.org/wiki/Atlantic_bluefin_tuna",
      fishbase: "https://www.fishbase.se/summary/147"
    }
  },
  {
    scientificName: "Dicentrarchus labrax",
    commonNames: ["European Seabass", "Sea Bass", "Branzino"],
    taxonomicHierarchy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Actinopterygii",
      order: "Perciformes",
      family: "Moronidae",
      genus: "Dicentrarchus",
      species: "Dicentrarchus labrax"
    },
    description: "European seabass is a popular marine fish species found along European coasts and in the Mediterranean. They have a silvery body with a darker back and can grow over 1 meter in length. Highly valued for their delicate white flesh and mild flavor.",
    habitat: "Coastal waters, estuaries, lagoons, and occasionally freshwater. Prefers rocky reefs, seagrass beds, and sandy bottoms. Tolerates wide salinity range.",
    distribution: "Eastern Atlantic from Norway to Senegal, Mediterranean Sea, Black Sea. Common along European coastlines.",
    morphology: {
      maxLength: 103,
      maxWeight: 12,
      distinctiveFeatures: [
        "Silvery-grey body with darker back",
        "Two dorsal fins with spines",
        "Large mouth extending beyond eye",
        "Preoperculum serrated at angle"
      ]
    },
    ecology: {
      diet: "Carnivorous, feeding on small fish, crustaceans, mollusks, and worms. Juveniles eat invertebrates, adults hunt fish.",
      behavior: "Gregarious when young, more solitary as adults. Nocturnal hunter. Migrates offshore in winter, returns to coast in spring.",
      depthRange: {
        min: 0,
        max: 100
      }
    },
    conservationStatus: "Least Concern",
    economicImportance: "Major commercial and recreational species. Important in Mediterranean cuisine. Extensively farmed in aquaculture. Annual production exceeds 100,000 tonnes.",
    imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
    thumbnailUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200",
    externalLinks: {
      wikipedia: "https://en.wikipedia.org/wiki/European_bass",
      fishbase: "https://www.fishbase.se/summary/358"
    }
  },
  {
    scientificName: "Amphiprion ocellaris",
    commonNames: ["Clownfish", "False Percula Clownfish", "Ocellaris Clownfish"],
    taxonomicHierarchy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Actinopterygii",
      order: "Perciformes",
      family: "Pomacentridae",
      genus: "Amphiprion",
      species: "Amphiprion ocellaris"
    },
    description: "The clownfish is a small, brightly colored marine fish famous for its symbiotic relationship with sea anemones. They have distinctive orange and white bands with black margins. Popularized by the movie 'Finding Nemo'. All clownfish are born male and can change sex to female.",
    habitat: "Tropical coral reefs of the Indo-Pacific. Lives exclusively among the tentacles of sea anemones (Heteractis magnifica, Stichodactyla gigantea, S. mertensii).",
    distribution: "Eastern Indian Ocean and western Pacific Ocean. Found in waters of Southeast Asia, Philippines, Indonesia, and Northern Australia.",
    morphology: {
      maxLength: 11,
      maxWeight: 0.25,
      distinctiveFeatures: [
        "Orange body with three white bars",
        "Black margins on fins and bars",
        "Rounded tail fin",
        "Thick mucus coating protects from anemone stings"
      ]
    },
    ecology: {
      diet: "Omnivorous, feeding on algae, zooplankton, small crustaceans, and anemone leftovers. Also eats parasites from host anemone.",
      behavior: "Lives in small groups within single anemone. Exhibits protandrous hermaphroditism (male to female sex change). Aggressive territorial defense.",
      depthRange: {
        min: 1,
        max: 15
      }
    },
    conservationStatus: "Least Concern",
    economicImportance: "Very popular marine aquarium species. Bred extensively in captivity. Subject of marine conservation efforts. Tourism attraction for reef diving.",
    imageUrl: "https://images.unsplash.com/photo-1520990757023-e6200e3c8fee?w=800",
    thumbnailUrl: "https://images.unsplash.com/photo-1520990757023-e6200e3c8fee?w=200",
    externalLinks: {
      wikipedia: "https://en.wikipedia.org/wiki/Ocellaris_clownfish",
      fishbase: "https://www.fishbase.se/summary/5569"
    }
  },
  {
    scientificName: "Paracanthurus hepatus",
    commonNames: ["Blue Tang", "Regal Tang", "Palette Surgeonfish"],
    taxonomicHierarchy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Actinopterygii",
      order: "Perciformes",
      family: "Acanthuridae",
      genus: "Paracanthurus",
      species: "Paracanthurus hepatus"
    },
    description: "The blue tang is a vibrant blue marine fish with a distinctive yellow tail and black markings. They have a sharp spine on each side of the tail base that can inflict painful wounds. Popular in aquariums and known from the movie 'Finding Dory'.",
    habitat: "Coral reefs and rocky areas in tropical Indo-Pacific waters. Prefers reef slopes and channels with moderate to strong currents.",
    distribution: "Indo-Pacific region from East Africa to Samoa, north to Japan, south to Great Barrier Reef and New Caledonia. Common throughout tropical reef systems.",
    morphology: {
      maxLength: 31,
      maxWeight: 0.6,
      distinctiveFeatures: [
        "Royal blue body coloration",
        "Yellow tail fin (caudal fin)",
        "Black 'palette' marking on side",
        "Retractable scalpel-like spine on tail base"
      ]
    },
    ecology: {
      diet: "Primarily herbivorous, grazing on algae and zooplankton. Feeds on phytoplankton and algae growing on coral and rocks.",
      behavior: "Forms large feeding aggregations. Juveniles hide in coral branches. Uses tail spine for defense. Can change color intensity based on mood.",
      depthRange: {
        min: 2,
        max: 40
      }
    },
    conservationStatus: "Least Concern",
    economicImportance: "Popular marine aquarium species but difficult to breed in captivity. Important for reef ecosystem health as algae grazer. Tourism attraction for snorkelers and divers.",
    imageUrl: "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=800",
    thumbnailUrl: "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=200",
    externalLinks: {
      wikipedia: "https://en.wikipedia.org/wiki/Paracanthurus_hepatus",
      fishbase: "https://www.fishbase.se/summary/5686"
    }
  },
  {
    scientificName: "Carcharodon carcharias",
    commonNames: ["Great White Shark", "White Shark", "White Pointer"],
    taxonomicHierarchy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Chondrichthyes",
      order: "Lamniformes",
      family: "Lamnidae",
      genus: "Carcharodon",
      species: "Carcharodon carcharias"
    },
    description: "The great white shark is the world's largest predatory fish, reaching over 6 meters in length. They have a robust, torpedo-shaped body with a pointed snout and distinctive black eye. Great whites are apex predators with exceptional sensory abilities including electroreception.",
    habitat: "Coastal and offshore temperate and subtropical waters. Found near surface to depths of 1,200m. Prefers areas with high seal and sea lion populations.",
    distribution: "Worldwide in temperate and tropical oceans. Common off coasts of Australia, South Africa, California, Mediterranean, and Japan. Highly migratory.",
    morphology: {
      maxLength: 700,
      maxWeight: 2000,
      distinctiveFeatures: [
        "Grey dorsal surface, white ventral surface",
        "Large triangular serrated teeth",
        "Powerful crescent-shaped tail",
        "Five gill slits on each side",
        "Black eye with no nictitating membrane"
      ]
    },
    ecology: {
      diet: "Carnivorous apex predator. Feeds on fish, rays, other sharks, seals, sea lions, dolphins, whale carcasses. Uses ambush tactics.",
      behavior: "Solitary hunter but may aggregate at feeding sites. Undertakes long-distance migrations. Breaches water when hunting seals. Exhibits curiosity and investigative behavior.",
      depthRange: {
        min: 0,
        max: 1200
      }
    },
    conservationStatus: "Vulnerable",
    economicImportance: "Protected species in many countries. Important for marine ecosystem balance. Significant eco-tourism value for cage diving. Subject of conservation and research programs.",
    imageUrl: "https://images.unsplash.com/photo-1560275619-4662e36fa65c?w=800",
    thumbnailUrl: "https://images.unsplash.com/photo-1560275619-4662e36fa65c?w=200",
    externalLinks: {
      wikipedia: "https://en.wikipedia.org/wiki/Great_white_shark",
      fishbase: "https://www.fishbase.se/summary/1007"
    }
  },
  {
    scientificName: "Sphyrna mokarran",
    commonNames: ["Great Hammerhead Shark", "Hammerhead Shark"],
    taxonomicHierarchy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Chondrichthyes",
      order: "Carcharhiniformes",
      family: "Sphyrnidae",
      genus: "Sphyrna",
      species: "Sphyrna mokarran"
    },
    description: "The great hammerhead is the largest of all hammerhead species, distinguished by its T-shaped head called a cephalofoil. This unique head shape provides enhanced sensory capabilities and maneuverability. They are powerful predators that can grow over 6 meters in length.",
    habitat: "Coastal and offshore tropical and warm temperate waters. Found near surface to depths of 300m. Prefers continental shelves, coral reefs, and lagoons.",
    distribution: "Worldwide in tropical and warm temperate seas. Common in Atlantic, Indian, and Pacific Oceans. Migrates to higher latitudes in summer.",
    morphology: {
      maxLength: 610,
      maxWeight: 450,
      distinctiveFeatures: [
        "Distinctive T-shaped hammer head (cephalofoil)",
        "Tall, sickle-shaped first dorsal fin",
        "Grey-brown to olive coloration",
        "Nearly straight front edge of head"
      ]
    },
    ecology: {
      diet: "Carnivorous, feeding on stingrays (favorite prey), fish, squid, octopus, crustaceans, and other sharks. Uses head to pin down stingrays.",
      behavior: "Solitary hunter, occasionally forms small groups. Undertakes seasonal migrations. Uses electroreception in hammer head to detect buried prey. Viviparous reproduction.",
      depthRange: {
        min: 1,
        max: 300
      }
    },
    conservationStatus: "Critically Endangered",
    economicImportance: "Threatened by overfishing for fins (shark fin soup). Protected in many regions. Important for maintaining marine ecosystem balance. Eco-tourism value for diving.",
    imageUrl: "https://images.unsplash.com/photo-1564053489984-317bbd824340?w=800",
    thumbnailUrl: "https://images.unsplash.com/photo-1564053489984-317bbd824340?w=200",
    externalLinks: {
      wikipedia: "https://en.wikipedia.org/wiki/Great_hammerhead",
      fishbase: "https://www.fishbase.se/summary/912"
    }
  },
  {
    scientificName: "Mobula birostris",
    commonNames: ["Giant Manta Ray", "Manta Ray", "Devil Ray"],
    taxonomicHierarchy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Chondrichthyes",
      order: "Myliobatiformes",
      family: "Mobulidae",
      genus: "Mobula",
      species: "Mobula birostris"
    },
    description: "The giant manta ray is the world's largest ray species, with wingspans exceeding 7 meters. They are gentle filter feeders with distinctive cephalic fins (head fins) that channel water into their mouths. Highly intelligent with the largest brain-to-body ratio of any fish.",
    habitat: "Pelagic species in tropical and subtropical waters. Found near surface in coastal areas, offshore islands, and coral reefs. Frequents cleaning stations.",
    distribution: "Circumglobal in tropical and warm temperate oceans. Common in Indo-Pacific, Atlantic, and Eastern Pacific. Undertakes long-distance migrations.",
    morphology: {
      maxLength: 700,
      maxWeight: 3000,
      distinctiveFeatures: [
        "Enormous triangular pectoral fins (wings)",
        "Two forward-facing cephalic fins",
        "Wide terminal mouth",
        "Dark dorsal surface, white ventral with unique spot patterns",
        "Whip-like tail without spine"
      ]
    },
    ecology: {
      diet: "Filter feeder consuming zooplankton, small fish, and crustaceans. Feeds by swimming with mouth open, filtering water through gill plates.",
      behavior: "Highly intelligent and curious. Visits cleaning stations regularly. Forms feeding aggregations. Performs acrobatic breaches. Interacts with divers.",
      depthRange: {
        min: 0,
        max: 120
      }
    },
    conservationStatus: "Vulnerable",
    economicImportance: "Major eco-tourism attraction worth millions annually. Protected in many countries. Subject of international conservation efforts. Research focus for marine biology.",
    imageUrl: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800",
    thumbnailUrl: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=200",
    externalLinks: {
      wikipedia: "https://en.wikipedia.org/wiki/Giant_oceanic_manta_ray",
      fishbase: "https://www.fishbase.se/summary/Manta-birostris.html"
    }
  },
  {
    scientificName: "Hippocampus kuda",
    commonNames: ["Common Seahorse", "Spotted Seahorse", "Yellow Seahorse"],
    taxonomicHierarchy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Actinopterygii",
      order: "Syngnathiformes",
      family: "Syngnathidae",
      genus: "Hippocampus",
      species: "Hippocampus kuda"
    },
    description: "Seahorses are unique fish with horse-like heads, prehensile tails, and upright swimming posture. Males carry fertilized eggs in a brood pouch and give birth to live young. They lack scales, instead having bony armor. Can change color to match surroundings.",
    habitat: "Shallow coastal waters including coral reefs, seagrass beds, mangroves, and estuaries. Anchors to vegetation or coral using prehensile tail.",
    distribution: "Indo-Pacific region from India to Japan, Indonesia, Philippines, and Australia. Common in warm coastal waters throughout Southeast Asia.",
    morphology: {
      maxLength: 30,
      maxWeight: 0.05,
      distinctiveFeatures: [
        "Horse-like head with tubular snout",
        "Prehensile tail without caudal fin",
        "Bony plates instead of scales",
        "Upright swimming posture",
        "Males have ventral brood pouch"
      ]
    },
    ecology: {
      diet: "Carnivorous, feeding on small crustaceans, zooplankton, and fish larvae. Ambush predator using camouflage and suction feeding.",
      behavior: "Sedentary, anchoring to substrate. Males brood eggs in pouch. Monogamous pair bonding. Diurnal with morning courtship rituals. Poor swimmers.",
      depthRange: {
        min: 0,
        max: 68
      }
    },
    conservationStatus: "Vulnerable",
    economicImportance: "Threatened by traditional medicine trade, aquarium trade, and habitat loss. Protected under CITES Appendix II. Important indicator species for ecosystem health.",
    imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800",
    thumbnailUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=200",
    externalLinks: {
      wikipedia: "https://en.wikipedia.org/wiki/Hippocampus_kuda",
      fishbase: "https://www.fishbase.se/summary/6543"
    }
  },
  {
    scientificName: "Tetraodon nigroviridis",
    commonNames: ["Green Spotted Puffer", "Pufferfish", "Leopard Puffer"],
    taxonomicHierarchy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Actinopterygii",
      order: "Tetraodontiformes",
      family: "Tetraodontidae",
      genus: "Tetraodon",
      species: "Tetraodon nigroviridis"
    },
    description: "Pufferfish are characterized by their ability to inflate their bodies with water or air when threatened, making them appear larger and more difficult to swallow. They contain tetrodotoxin, a powerful neurotoxin that makes them deadly to predators. Have beak-like teeth formed from fused jaw bones.",
    habitat: "Brackish and freshwater environments including estuaries, rivers, and coastal areas. Prefers areas with vegetation and muddy substrates.",
    distribution: "Southeast Asia including Thailand, Malaysia, Indonesia, Philippines, Myanmar, and India. Found in rivers draining to Indian Ocean and Western Pacific.",
    morphology: {
      maxLength: 17,
      maxWeight: 0.15,
      distinctiveFeatures: [
        "Green-yellow coloration with black spots",
        "Ability to inflate body into sphere",
        "Beak-like fused teeth",
        "No pelvic fins",
        "Thick, elastic, scaleless skin"
      ]
    },
    ecology: {
      diet: "Carnivorous, feeding on mollusks, crustaceans, worms, and algae. Uses powerful beak to crush hard-shelled prey like snails and clams.",
      behavior: "Solitary and territorial. Inflates body as defense mechanism. Slow swimmer using pectoral and dorsal fins for propulsion. Curious and intelligent.",
      depthRange: {
        min: 0,
        max: 20
      }
    },
    conservationStatus: "Least Concern",
    economicImportance: "Popular aquarium species. Contains deadly tetrodotoxin making it unsuitable for consumption (unlike some pufferfish species prepared as fugu). Important for mollusk population control.",
    imageUrl: "https://images.unsplash.com/photo-1535527142972-11fabc6d0ad4?w=800",
    thumbnailUrl: "https://images.unsplash.com/photo-1535527142972-11fabc6d0ad4?w=200",
    externalLinks: {
      wikipedia: "https://en.wikipedia.org/wiki/Tetraodon_nigroviridis",
      fishbase: "https://www.fishbase.se/summary/12598"
    }
  },
  {
    scientificName: "Pterois volitans",
    commonNames: ["Red Lionfish", "Lionfish", "Butterfly Cod"],
    taxonomicHierarchy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Actinopterygii",
      order: "Scorpaeniformes",
      family: "Scorpaenidae",
      genus: "Pterois",
      species: "Pterois volitans"
    },
    description: "The red lionfish is a venomous coral reef fish known for its striking appearance with red, white, and black vertical stripes and elaborate fins. Their venomous spines can cause extremely painful stings. They are invasive species in Atlantic waters causing ecological damage.",
    habitat: "Coral reefs, rocky crevices, and artificial structures. Prefers sheltered areas during day, hunts in open at night. Found from shallow reefs to depths of 50m.",
    distribution: "Native to Indo-Pacific from Australia to French Polynesia. Invasive in Western Atlantic, Caribbean, and Mediterranean. One of most widespread invasive marine species.",
    morphology: {
      maxLength: 47,
      maxWeight: 1.2,
      distinctiveFeatures: [
        "Zebra-like red and white vertical stripes",
        "Long, separated venomous dorsal spines",
        "Large, fan-like pectoral fins",
        "Fleshy tentacles above eyes",
        "18 venomous spines total"
      ]
    },
    ecology: {
      diet: "Carnivorous ambush predator. Feeds on small fish, crustaceans, and mollusks. Hunts by cornering prey with large pectoral fins then striking rapidly.",
      behavior: "Nocturnal hunter, solitary. Uses venomous spines defensively. Voracious predator with few natural enemies. Females release egg masses.",
      depthRange: {
        min: 2,
        max: 50
      }
    },
    conservationStatus: "Least Concern (native range) / Invasive (Atlantic)",
    economicImportance: "Invasive species causing major ecological and economic damage in Atlantic. Control programs include fishing derbies. Edible when spines removed. Popular aquarium species.",
    imageUrl: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800",
    thumbnailUrl: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=200",
    externalLinks: {
      wikipedia: "https://en.wikipedia.org/wiki/Pterois",
      fishbase: "https://www.fishbase.se/summary/5428"
    }
  },
  {
    scientificName: "Scarus coeruleus",
    commonNames: ["Blue Parrotfish", "Parrotfish"],
    taxonomicHierarchy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Actinopterygii",
      order: "Perciformes",
      family: "Scaridae",
      genus: "Scarus",
      species: "Scarus coeruleus"
    },
    description: "Parrotfish are colorful reef fish named for their beak-like fused teeth resembling a parrot's beak. They scrape algae from coral and rocks, ingesting coral skeleton in the process. They excrete fine coral sand, contributing significantly to sand production on tropical beaches.",
    habitat: "Coral reefs and rocky areas in tropical Western Atlantic. Feeds on algae growing on dead coral and rocks. Sleeps in mucus cocoon at night.",
    distribution: "Western Atlantic from Maryland to Brazil, including Caribbean Sea, Gulf of Mexico, Bahamas, and Bermuda. Common throughout Caribbean reef systems.",
    morphology: {
      maxLength: 120,
      maxWeight: 20,
      distinctiveFeatures: [
        "Bright blue coloration (adults)",
        "Beak-like fused teeth",
        "Large scales",
        "Rounded tail fin",
        "Pharyngeal teeth for grinding coral"
      ]
    },
    ecology: {
      diet: "Herbivorous, scraping algae from coral and rocks. Ingests coral skeleton, which is ground by pharyngeal teeth and excreted as sand.",
      behavior: "Diurnal grazer. Sleeps in reef crevices at night inside protective mucus cocoon. Changes sex from female to male (protogynous hermaphrodite).",
      depthRange: {
        min: 3,
        max: 25
      }
    },
    conservationStatus: "Least Concern",
    economicImportance: "Critical for coral reef health by controlling algae. Major sand producer (one fish can produce 90kg of sand per year). Important for reef-based tourism. Some fishing for food.",
    imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800",
    thumbnailUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=200",
    externalLinks: {
      wikipedia: "https://en.wikipedia.org/wiki/Scarus_coeruleus",
      fishbase: "https://www.fishbase.se/summary/5561"
    }
  },
  {
    scientificName: "Lophius piscatorius",
    commonNames: ["Anglerfish", "Monkfish", "Goosefish"],
    taxonomicHierarchy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Actinopterygii",
      order: "Lophiiformes",
      family: "Lophiidae",
      genus: "Lophius",
      species: "Lophius piscatorius"
    },
    description: "The anglerfish is a bottom-dwelling predator famous for its bioluminescent lure (esca) on a modified dorsal spine. They have enormous mouths and can swallow prey nearly as large as themselves. The tail is highly prized in cuisine as 'monkfish'.",
    habitat: "Benthic species living on sandy or muddy sea bottoms. Prefers continental shelf and slope areas. Lies buried in sediment waiting for prey.",
    distribution: "Eastern Atlantic from Barents Sea to Mediterranean and Black Sea, including North Sea. Common along European continental shelf from 20-1000m depth.",
    morphology: {
      maxLength: 200,
      maxWeight: 57,
      distinctiveFeatures: [
        "Enormous mouth with sharp teeth",
        "Modified first dorsal spine as fishing rod (illicium)",
        "Fleshy lure (esca) on end of spine",
        "Flattened, broad body",
        "Mottled brown camouflage coloration"
      ]
    },
    ecology: {
      diet: "Carnivorous ambush predator. Feeds on fish, cephalopods, crustaceans, and seabirds. Uses bioluminescent lure to attract prey within striking distance.",
      behavior: "Sedentary ambush predator. Lies motionless on bottom, wiggling lure to attract prey. Can swallow prey up to half its body size. Solitary except during breeding.",
      depthRange: {
        min: 20,
        max: 1000
      }
    },
    conservationStatus: "Least Concern",
    economicImportance: "Highly valued commercial species. Tail marketed as 'monkfish' - firm, white flesh prized in cuisine. Subject to fishery management due to past overfishing.",
    imageUrl: "https://images.unsplash.com/photo-1535527142972-11fabc6d0ad4?w=800",
    thumbnailUrl: "https://images.unsplash.com/photo-1535527142972-11fabc6d0ad4?w=200",
    externalLinks: {
      wikipedia: "https://en.wikipedia.org/wiki/Lophius_piscatorius",
      fishbase: "https://www.fishbase.se/summary/1098"
    }
  },
  {
    scientificName: "Dasyatis pastinaca",
    commonNames: ["Common Stingray", "Stingray"],
    taxonomicHierarchy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Chondrichthyes",
      order: "Myliobatiformes",
      family: "Dasyatidae",
      genus: "Dasyatis",
      species: "Dasyatis pastinaca"
    },
    description: "The common stingray is a species of stingray found in coastal European waters. They have a flattened, diamond-shaped body and a long whip-like tail with a venomous spine. They lie buried in sand with only eyes protruding, waiting for prey.",
    habitat: "Sandy and muddy bottoms in coastal and estuarine waters. Often found in shallow bays, lagoons, and river mouths. Tolerates low salinity.",
    distribution: "Eastern Atlantic from southern Norway to South Africa, Mediterranean Sea, and Black Sea. Common along European and North African coasts.",
    morphology: {
      maxLength: 250,
      maxWeight: 30,
      distinctiveFeatures: [
        "Diamond-shaped flattened body (disc)",
        "Long whip-like tail",
        "One or more venomous serrated spines on tail",
        "Olive-brown to grey dorsal surface",
        "Eyes and spiracles on top of body"
      ]
    },
    ecology: {
      diet: "Carnivorous, feeding on mollusks, crustaceans, worms, and small fish. Uses electroreception to detect buried prey. Crushes prey with powerful jaws.",
      behavior: "Benthic, lying buried in sediment during day. More active at night. Uses pectoral fins to create undulating waves for swimming. Ovoviviparous (live birth).",
      depthRange: {
        min: 1,
        max: 200
      }
    },
    conservationStatus: "Data Deficient",
    economicImportance: "Minor commercial fishery. Often caught as bycatch. Tail spine can cause painful injuries to swimmers and fishermen. Some culinary use in Mediterranean region.",
    imageUrl: "https://images.unsplash.com/photo-1564053489984-317bbd824340?w=800",
    thumbnailUrl: "https://images.unsplash.com/photo-1564053489984-317bbd824340?w=200",
    externalLinks: {
      wikipedia: "https://en.wikipedia.org/wiki/Common_stingray",
      fishbase: "https://www.fishbase.se/summary/936"
    }
  },
  {
    scientificName: "Sparus aurata",
    commonNames: ["Gilthead Seabream", "Dorade", "Sea Bream"],
    taxonomicHierarchy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Actinopterygii",
      order: "Perciformes",
      family: "Sparidae",
      genus: "Sparus",
      species: "Sparus aurata"
    },
    description: "The gilthead seabream is a coastal marine fish named for the golden bar marking between its eyes. They have powerful jaws with crushing teeth adapted for feeding on shellfish. Highly prized in Mediterranean cuisine for their delicate, sweet flesh.",
    habitat: "Coastal waters, especially over sandy and seagrass bottoms. Found in shallow bays, estuaries, and lagoons. Juveniles tolerate very low salinity in lagoons.",
    distribution: "Eastern Atlantic from British Isles to Senegal, Mediterranean Sea, and occasionally Black Sea. Most abundant in Mediterranean and adjacent Atlantic waters.",
    morphology: {
      maxLength: 70,
      maxWeight: 17,
      distinctiveFeatures: [
        "Golden bar between eyes (frontal region)",
        "Silver-grey body with pink flush",
        "Single dorsal fin with spines and soft rays",
        "Powerful crushing teeth (molars)",
        "Forked tail fin"
      ]
    },
    ecology: {
      diet: "Carnivorous, feeding primarily on mollusks, crustaceans, and occasionally fish. Uses powerful jaws and molar teeth to crush shells of prey.",
      behavior: "Gregarious when young, more solitary as adults. Protandrous hermaphrodite (male when young, female when older). Undertakes seasonal migrations between shallow and deeper waters.",
      depthRange: {
        min: 1,
        max: 150
      }
    },
    conservationStatus: "Least Concern",
    economicImportance: "One of most important aquaculture species in Mediterranean. Annual production exceeds 150,000 tonnes. Wild fishery also significant. Highly valued for culinary quality.",
    imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
    thumbnailUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200",
    externalLinks: {
      wikipedia: "https://en.wikipedia.org/wiki/Gilt-head_bream",
      fishbase: "https://www.fishbase.se/summary/1401"
    }
  },
  {
    scientificName: "Clupea harengus",
    commonNames: ["Atlantic Herring", "Herring"],
    taxonomicHierarchy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Actinopterygii",
      order: "Clupeiformes",
      family: "Clupeidae",
      genus: "Clupea",
      species: "Clupea harengus"
    },
    description: "Atlantic herring are small, schooling pelagic fish that have been economically important for centuries. They have streamlined, silvery bodies and travel in enormous schools that can stretch for miles. Form one of the largest fish biomasses in the ocean.",
    habitat: "Pelagic in cold, temperate waters. Found in coastal and offshore areas. Forms massive schools in midwater and near surface. Undertakes spawning migrations to coastal areas.",
    distribution: "North Atlantic Ocean on both American and European sides, from Labrador and South Carolina to Greenland, Iceland, Scandinavia, and Bay of Biscay.",
    morphology: {
      maxLength: 45,
      maxWeight: 0.7,
      distinctiveFeatures: [
        "Streamlined, compressed body",
        "Silvery coloration with blue-green back",
        "Single dorsal fin in middle of back",
        "Forked tail fin",
        "No lateral line visible",
        "Saw-toothed belly (scutes)"
      ]
    },
    ecology: {
      diet: "Planktivorous filter feeder. Feeds on copepods, krill, small crustaceans, fish larvae, and pteropods. Feeds by swimming with mouth open.",
      behavior: "Forms enormous schools for protection. Undertakes extensive migrations for feeding and spawning. Spawns in coastal areas, releasing eggs that stick to seabed. Prey for numerous predators.",
      depthRange: {
        min: 0,
        max: 360
      }
    },
    conservationStatus: "Least Concern",
    economicImportance: "One of most important commercial fish species globally. Used fresh, frozen, canned, pickled, smoked (kippers), and for fish meal and oil. Historical importance in European trade.",
    imageUrl: "https://images.unsplash.com/photo-1560155477-f2b52962fd62?w=800",
    thumbnailUrl: "https://images.unsplash.com/photo-1560155477-f2b52962fd62?w=200",
    externalLinks: {
      wikipedia: "https://en.wikipedia.org/wiki/Atlantic_herring",
      fishbase: "https://www.fishbase.se/summary/24"
    }
  },
  {
    scientificName: "Scomber scombrus",
    commonNames: ["Atlantic Mackerel", "Mackerel", "Boston Mackerel"],
    taxonomicHierarchy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Actinopterygii",
      order: "Perciformes",
      family: "Scombridae",
      genus: "Scomber",
      species: "Scomber scombrus"
    },
    description: "Atlantic mackerel are fast-swimming pelagic fish with distinctive wavy black bars on their backs and iridescent blue-green coloration. They are important commercial species and popular game fish. Lack a swim bladder and must swim continuously to maintain depth.",
    habitat: "Pelagic in temperate and cold waters of continental shelf. Forms large schools near surface and in midwater. Prefers temperatures of 8-20°C.",
    distribution: "North Atlantic Ocean from North Carolina to Labrador in western Atlantic, and Mediterranean Sea to Norway in eastern Atlantic. Undertakes extensive seasonal migrations.",
    morphology: {
      maxLength: 60,
      maxWeight: 3.4,
      distinctiveFeatures: [
        "Wavy black vertical bars on back",
        "Iridescent blue-green dorsal surface",
        "Silver-white belly",
        "Two dorsal fins, first spiny",
        "Five finlets after dorsal and anal fins",
        "Forked tail fin"
      ]
    },
    ecology: {
      diet: "Carnivorous, feeding on small fish (herring, sand eels), crustaceans (copepods, krill), and squid. Active predator hunting in schools.",
      behavior: "Forms large schools segregated by size. Undertakes seasonal migrations between feeding and spawning grounds. Fast swimmer reaching speeds of 35 km/h. No swim bladder.",
      depthRange: {
        min: 0,
        max: 1000
      }
    },
    conservationStatus: "Least Concern",
    economicImportance: "Major commercial fishery species. Consumed fresh, canned, smoked, and salted. Important forage fish for larger predators. Popular recreational fishing target. Rich in omega-3 fatty acids.",
    imageUrl: "https://images.unsplash.com/photo-1534043464124-3be32fe000c9?w=800",
    thumbnailUrl: "https://images.unsplash.com/photo-1534043464124-3be32fe000c9?w=200",
    externalLinks: {
      wikipedia: "https://en.wikipedia.org/wiki/Atlantic_mackerel",
      fishbase: "https://www.fishbase.se/summary/164"
    }
  },
  {
    scientificName: "Merluccius merluccius",
    commonNames: ["European Hake", "Hake"],
    taxonomicHierarchy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Actinopterygii",
      order: "Gadiformes",
      family: "Merlucciidae",
      genus: "Merluccius",
      species: "Merluccius merluccius"
    },
    description: "European hake is an important commercial fish with elongated body and large mouth with sharp teeth. They are voracious predators hunting mainly at night. The flesh is white, delicate, and highly valued in European cuisine, especially in Spain and Portugal.",
    habitat: "Demersal species living near seabed on continental shelf and slope. Prefers muddy or sandy bottoms. Juveniles in shallower waters, adults in deeper areas.",
    distribution: "Eastern Atlantic from Norway to Mauritania, Mediterranean Sea, and Black Sea. Most abundant off coasts of Spain, Portugal, and North Africa.",
    morphology: {
      maxLength: 140,
      maxWeight: 15,
      distinctiveFeatures: [
        "Elongated body with large head",
        "Large mouth with sharp teeth",
        "Two dorsal fins, first short and high",
        "Silver-grey coloration, darker on back",
        "Black interior of mouth and gill cavity"
      ]
    },
    ecology: {
      diet: "Carnivorous predator feeding on fish (anchovies, sardines, herring), squid, and crustaceans. Primarily nocturnal hunter rising from bottom to feed in midwater.",
      behavior: "Undertakes daily vertical migrations, moving toward surface at night to feed. Forms schools segregated by size. Spawns in deeper waters. Cannibalistic on juveniles.",
      depthRange: {
        min: 30,
        max: 1000
      }
    },
    conservationStatus: "Least Concern",
    economicImportance: "One of most important commercial fish in Europe. Fresh and frozen fillets highly valued. Subject to fishery management due to historical overfishing. Annual catches exceed 100,000 tonnes.",
    imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
    thumbnailUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200",
    externalLinks: {
      wikipedia: "https://en.wikipedia.org/wiki/European_hake",
      fishbase: "https://www.fishbase.se/summary/481"
    }
  },
  {
    scientificName: "Solea solea",
    commonNames: ["Common Sole", "Dover Sole"],
    taxonomicHierarchy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Actinopterygii",
      order: "Pleuronectiformes",
      family: "Soleidae",
      genus: "Solea",
      species: "Solea solea"
    },
    description: "Common sole is a right-eyed flatfish highly prized for its delicate flavor. They lie flat on sandy bottoms with both eyes on the right side of their body. The upper (eyed) side is brown with dark mottling for camouflage, while the underside is white.",
    habitat: "Benthic species living on sandy or muddy seabeds in coastal waters. Prefers soft substrates where it can bury itself. Found in estuaries, bays, and continental shelf.",
    distribution: "Eastern Atlantic from Norway to Senegal, Mediterranean Sea, and occasionally Baltic Sea. Most abundant in North Sea and Bay of Biscay.",
    morphology: {
      maxLength: 70,
      maxWeight: 3,
      distinctiveFeatures: [
        "Flattened oval body",
        "Both eyes on right side",
        "Brown upper side with dark blotches",
        "White blind side (underneath)",
        "Rounded snout",
        "Small mouth on underside"
      ]
    },
    ecology: {
      diet: "Carnivorous, feeding on worms, small crustaceans, mollusks, and occasionally small fish. Hunts at night, detecting prey using smell and touch.",
      behavior: "Nocturnal, lying buried in sand during day with only eyes exposed. Moves by undulating body. Spawns offshore in deeper water. Right-eyed flatfish.",
      depthRange: {
        min: 10,
        max: 200
      }
    },
    conservationStatus: "Least Concern",
    economicImportance: "Highly valued commercial species, especially in European markets. One of most expensive flatfish. Subject to strict fishery management. Prized in French and British cuisine as 'Dover sole'.",
    imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
    thumbnailUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200",
    externalLinks: {
      wikipedia: "https://en.wikipedia.org/wiki/Common_sole",
      fishbase: "https://www.fishbase.se/summary/1030"
    }
  }
];

/**
 * Search for species by scientific or common name
 * @param {string} query - Search query (case-insensitive)
 * @returns {Array<Species>} Array of matching species
 */
export const searchSpecies = (query) => {
  if (!query || query.length < 2) return [];
  
  const lowerQuery = query.toLowerCase().trim();
  
  return SPECIES_DATABASE.filter(species => {
    // Search in scientific name
    if (species.scientificName.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    // Search in common names
    return species.commonNames.some(name => 
      name.toLowerCase().includes(lowerQuery)
    );
  });
};

/**
 * Get species by exact scientific name match
 * @param {string} scientificName - Scientific name to search
 * @returns {Species|null} Matching species or null
 */
export const getSpeciesByScientificName = (scientificName) => {
  return SPECIES_DATABASE.find(
    species => species.scientificName.toLowerCase() === scientificName.toLowerCase()
  ) || null;
};

/**
 * Get all species names for autocomplete
 * @returns {Array<{scientificName: string, commonName: string}>} Array of species names
 */
export const getAllSpeciesNames = () => {
  return SPECIES_DATABASE.map(species => ({
    scientificName: species.scientificName,
    commonName: species.commonNames[0]
  }));
};

/**
 * Get species by taxonomic family
 * @param {string} family - Taxonomic family name
 * @returns {Array<Species>} Array of species in the family
 */
export const getSpeciesByFamily = (family) => {
  return SPECIES_DATABASE.filter(
    species => species.taxonomicHierarchy.family.toLowerCase() === family.toLowerCase()
  );
};

/**
 * Get unique list of families for filtering
 * @returns {Array<string>} Array of unique family names
 */
export const getAllFamilies = () => {
  const families = SPECIES_DATABASE.map(species => species.taxonomicHierarchy.family);
  return [...new Set(families)].sort();
};

/**
 * Get random popular species for quick links
 * @param {number} count - Number of species to return
 * @returns {Array<Species>} Array of random species
 */
export const getPopularSpecies = (count = 6) => {
  // Return first N species as "popular" (you can customize this logic)
  const popular = [
    "Amphiprion ocellaris", // Clownfish
    "Paracanthurus hepatus", // Blue Tang
    "Thunnus thynnus", // Bluefin Tuna
    "Salmo salar", // Atlantic Salmon
    "Carcharodon carcharias", // Great White Shark
    "Hippocampus kuda" // Seahorse
  ];
  
  return SPECIES_DATABASE
    .filter(species => popular.includes(species.scientificName))
    .slice(0, count);
};
