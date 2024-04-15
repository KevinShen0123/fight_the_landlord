<template>
    <b-card
      class="animated-card"
      :class="{'illegal': !isLegalToPlay,
                'last-played' : isLastPlayedCard,
                'unused' : unused,
                'selected-card': isSelected  
        }"
      @click="handleClick"
      :title="'[' + paddedCardId + '] '"
      border-variant="primary"
      body-class="card-info"
    >
    <b-card-text class = "rankAndsuit">
      {{ cardDisplayText }}
      </b-card-text>
      <!-- <template v-slot:footer v-if="includeLocation">
        <div class="location-info">
          {{ card?.locationType }} {{ card?.playerIndex ?? "" }}
        </div>
      </template> -->
    </b-card>
  </template>
    
<script setup lang="ts">
    import { computed,PropType} from 'vue';
    import { areCompatible,Card } from "../../../server/model"
    const emit = defineEmits(['cardClick']);
    const props = defineProps({
        card: Object as PropType<Card | null | undefined>,
        lastPlayedCard: Object as PropType<Card | null | undefined>,
        includeLocation: Boolean,
        selected: Boolean 
    });
    
    const cardDisplayText = computed(() => {
      return props.card ? `${props.card.rank}${props.card.suit}` : '';
    });
      // Computed property to check if the card is legal to play
    const isLegalToPlay = computed(() => {
      if (props.lastPlayedCard === null) {
        return true;
      }
      return true;
    });
  
    const isLastPlayedCard = computed(() => {
      return props.card?.id === props.lastPlayedCard?.id
    })
  
  
    const unused = computed(() => {
      return props.card?.locationType === "unused"
    })
  
    const paddedCardId = computed(() => {
      let id = (props.card as any).id
      while (id.length < 3) {
        id = " " + id;
      }
      return id;
    });

    const isSelected = computed(() => 
    {
      return props.selected
    });

    const handleClick = () => {
      if (isLegalToPlay.value) {
        emit('cardClick', props.card?.id);
      } else {
        console.log('Attempted to select an illegal card.');
      }
    };
</script>
  
  <style>
  .animated-card {
    flex: 0 1 90px; 
    max-width: 90px; 
    height: 135px;
    display: flex;
    flex-direction: column;
    justify-content: center; /* Center children vertically */
    align-items: center; /* Center children horizontally */
    position: relative; /* Add this to position your rankAndsuit absolutely */
  }
  .card-info {
    white-space: nowrap;
    /* monospace */
    font-family: 'Courier New', Courier, monospace; 
  }
  .location-info {
  
    font-family: 'Courier New', Courier, monospace;
    position: absolute; /* Positioning it relative to the card */
    bottom: 5px; /* Distance from the bottom */
    left: 0;
    width: 100%; /* Full width to center the text */
    text-align: center; /* Center the text within the div */
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
    font-size: 2em; 
    font-weight: bold; 
  }
  .selected-card {
  border: 2px solid rgb(6, 6, 4);  /* 黑色边框 */
  background-color: #fd0808;  /* 浅灰色背景，可以根据你的设计调整颜色 */
}
  </style>