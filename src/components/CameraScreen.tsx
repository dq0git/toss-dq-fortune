import React, { useEffect, useState } from 'react';
import { ImageResponse, openCamera, OpenCameraPermissionError, graniteEvent } from '@apps-in-toss/web-framework';
import './CameraScreen.css';
import { Button, BottomCTA, Asset, useToast } from '@toss/tds-mobile';


interface CameraScreenProps {
  onBack: () => void;
}

const CameraScreen: React.FC<CameraScreenProps> = ({ onBack }) => {
  const [image, setImage] = useState<ImageResponse | null>(null);
  const base64 = true;
  const toast = useToast();

  const handlePress = async () => {
    console.log('카메라 촬영 버튼이 눌렸습니다');
    try {
      const response = await openCamera({ base64 });
      setImage(response);
      // toast.openToast('프로필을 업데이트했어요', {
      //   icon: 'icon-check',
      //   iconType: 'circle',
      // });
    } catch (error) {
      if (error instanceof OpenCameraPermissionError) {
        console.log('권한 에러');
      }
      console.error('사진을 가져오는 데 실패했어요:', error);
      alert('사진 촬영에 실패했습니다.');
    }
  };

  const imageUri = base64 ? `data:image/jpeg;base64,${image?.dataUri}` : image?.dataUri;

  const handleBackClick = () => {
    const shouldLeave = window.confirm('촬영한 사진이 저장되지 않을 수 있어요. 나가시겠어요?');
    if (shouldLeave) {
      onBack();
    }
  };

  useEffect(() => {
    const unsubscribe = graniteEvent.addEventListener('backEvent', {
      onEvent: handleBackClick,
      onError: (error) => {
        alert(`에러가 발생했어요: ${error}`);
      },
    });

    return unsubscribe;
  }, [onBack]);

  return (
    <div className="camera-screen">
      <div className="camera-header">
        <h2>카메라</h2>
      </div>

      <div className="camera-container">
        {image ? (
          <img src={imageUri} alt="Captured" className="captured-image" />
        ) : (
          <span>사진이 없어요</span>
        )}
        <div className="camera-controls">
          <button className="camera-button" onClick={handlePress}>
            📸 카메라 촬영하기
          </button>
          <button className="back-button" onClick={handleBackClick}>
            취소
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ width: 80 }}>Square</span>
          <Asset.Image
            src="https://static.toss.im/2d-emojis/svg/u1F600.svg"
            frameShape={Asset.frameShape.SquareSmall}
            backgroundColor='#f0f0f0'
            scale={0.55}
          />
          <Asset.Image
            src="https://static.toss.im/2d-emojis/svg/u1F600.svg"
            frameShape={Asset.frameShape.SquareMedium}
            backgroundColor='#f0f0f0'
            scale={0.55}
          />
          <Asset.Image
            src="https://static.toss.im/2d-emojis/svg/u1F600.svg"
            frameShape={Asset.frameShape.SquareLarge}
            backgroundColor='#f0f0f0'
            scale={0.55}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ width: 80 }}>Rectangle</span>
          <Asset.Image
            src="https://static.toss.im/2d-emojis/svg/u1F600.svg"
            frameShape={Asset.frameShape.RectangleMedium}
            backgroundColor='#f0f0f0'
            scale={0.6}
          />
          <Asset.Image
            src="https://static.toss.im/2d-emojis/svg/u1F600.svg"
            frameShape={Asset.frameShape.RectangleLarge}
            backgroundColor='#f0f0f0'
            scale={0.6}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ width: 80 }}>Circle</span>
          <Asset.Image
            src="https://static.toss.im/2d-emojis/svg/u1F600.svg"
            frameShape={Asset.frameShape.CircleSmall}
            backgroundColor='#f0f0f0'
            scale={0.55}
          />
          <Asset.Image
            src="https://static.toss.im/2d-emojis/svg/u1F600.svg"
            frameShape={Asset.frameShape.CircleMedium}
            backgroundColor='#f0f0f0'
            scale={0.55}
          />
          <Asset.Image
            src="https://static.toss.im/2d-emojis/svg/u1F600.svg"
            frameShape={Asset.frameShape.CircleLarge}
            backgroundColor='#f0f0f0'
            scale={0.55}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ width: 80 }}>Card</span>
          <Asset.Image
            src="https://static.toss.im/2d-emojis/svg/u1F600.svg"
            frameShape={Asset.frameShape.CardSmall}
            backgroundColor='#f0f0f0'
            scale={0.7}
          />
          <Asset.Image
            src="https://static.toss.im/2d-emojis/svg/u1F600.svg"
            frameShape={Asset.frameShape.CardMedium}
            backgroundColor='#f0f0f0'
            scale={0.7}
          />
          <Asset.Image
            src="https://static.toss.im/2d-emojis/svg/u1F600.svg"
            frameShape={Asset.frameShape.CardLarge}
            backgroundColor='#f0f0f0'
            scale={0.7}
          />
        </div>
      </div>
    </div>
  );
};

export default CameraScreen;
