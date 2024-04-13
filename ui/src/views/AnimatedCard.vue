<template>
    <b-card
      class="animated-card"
      :class="{'illegal': !isLegalToPlay,
                'last-played' : isLastPlayedCard,
                'unused' : unused
        }"
      @click="$emit('cardClick', card.id)"
      :title="'[' + paddedCardId + '] '"
      border-variant="primary"
      body-class="card-info"
    >
    <b-card-text class = "rankAndsuit">
     {{ card.rank + card.suit}}
      </b-card-text>
      <template v-slot:footer v-if="includeLocation">
        <div class="location-info">
          {{ card.locationType }} {{ card.playerIndex ?? "" }}
        </div>
      </template>
    </b-card>
  </template>
    
    <script setup lang="ts">
    import { computed,PropType} from 'vue';
    import { areCompatible,Card } from "../../../server/model"
  
    const props = defineProps({
  card: {
    type: Object as PropType<Card>,
    default: () => ({}) // 提供一个默认空对象，视具体情况而定
  },
  lastPlayedCard: Object as PropType<Card | null | undefined>,
  includeLocation: Boolean
});
    
      // Computed property to check if the card is legal to play
    const isLegalToPlay = computed(() => {
      if (props.lastPlayedCard === null) {
        return true;
      }
      return areCompatible(props.card, (props as any).lastPlayedCard);
    });
  
    const isLastPlayedCard = computed(() => {
      return props.card?.id === props.lastPlayedCard?.id
    })
  
  
    const unused = computed(() => {
      return props.card?.locationType === "unused"
    })
  
    const paddedCardId = computed(() => {
      let id = props.card.id
      while (id.length < 3) {
        id = " " + id;
      }
      return id;
    });
    </script>
  
  <style>
  .animated-card {
    flex: 0 1 180px; 
    max-width: 180px; 
    height: 270px;
    display: flex;
    flex-direction: column; 
    justify-content: space-between; 
  }
  .card-info {
    white-space: pre; 
    /* monospace */
    font-family: 'Courier New', Courier, monospace; 
  }
  .location-info {
  
    font-family: 'Courier New', Courier, monospace; 
  }
  .illegal {
  
    opacity: 0.5;
    cursor: not-allowed;
  }
  .last-played{
    border-color: purple;
    box-shadow: 0 0 14px purple;
  }
  .unused{
    background-color: gray
  
  }
  .rankAndsuit{
    text-align: center;
    font-size: 5em; 
    font-weight: bold; 
  }
  </style>